import os
import uuid
from typing import Annotated, Any, Literal, TypedDict

from langchain_core.messages import BaseMessage, HumanMessage
from langchain_core.tools import tool
# from langchain_anthropic import ChatAnthropic
from langchain_openrouter import ChatOpenRouter

from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import END, START, StateGraph
from langgraph.graph.message import add_messages
# from langgraph.prebuilt import create_react_agent
from langchain.agents import create_agent
from langchain.chat_models import init_chat_model
from langchain.rate_limiters import InMemoryRateLimiter

from YoutubeData.youtube_data_adapter import data_adapter
from YoutubeData.youtube_queue import RedisYt, build_entry

MODEL_ID = "nvidia/nemotron-3.5-lightning:free"
rate_limiter = InMemoryRateLimiter(
    requests_per_second=0.275,  # <-- Super slow! We can only make a request once every 10 seconds!!
    check_every_n_seconds=0.1,  # Wake up every 100 ms to check whether allowed to make a request,
    max_bucket_size=10,  # Controls the maximum burst size.
)

# ---------------------------------------------------------------------------
# State
# ---------------------------------------------------------------------------

class QueueAgentState(TypedDict):
    # Deliberately no google_id (or any other user-identity) field here: this state is
    # what flows into the LLM-facing agent node and gets persisted by the checkpointer,
    # so identity must never live in it. Every tool/RedisYt call that needs google_id
    # gets it via a Python closure in run_queue_agent/build_tools instead - never from
    # graph state.
    user_prompt: str

    # Upfront context, fetched once before the graph runs
    channel_tags: list[str]
    initial_queue: list[str]

    # Working memory shared by the agent<->verify retry loop within this one invocation
    messages: Annotated[list[BaseMessage], add_messages]

    # Retry bookkeeping
    retry_count: int
    max_retries: int

    # Verification outcome
    verification_passed: bool
    verification_error: str | None

    # Final output
    final_queue: list[str] | None
    success: bool


# ---------------------------------------------------------------------------
# Tools
# ---------------------------------------------------------------------------

def _clean_mongo_doc(doc: Any) -> Any:
    """Strips the non-JSON-friendly bson ObjectId before handing a Mongo doc to the LLM."""
    if isinstance(doc, list):
        return [_clean_mongo_doc(item) for item in doc]
    if isinstance(doc, dict) and "_id" in doc:
        doc = dict(doc)
        doc["_id"] = str(doc["_id"])
    for unnecessary_key in ["_id", "videoThumbnail", "uploadDate",
                            "channelImages"]:
        doc = dict(doc)
        doc.pop(unnecessary_key, None)
    return doc


def build_tools(redis_client: RedisYt, google_id: str) -> list:
    """
    Builds the tool set for one agent invocation. Tools close over a request-scoped
    RedisYt instance and google_id rather than accepting them as LLM-controlled
    arguments - the queue identity must never be something the model can pick.

    The queue stores a title and thumbnail alongside each id so the site can render
    it without the videos database. Those are resolved here, from Mongo, rather
    than being tool arguments - the model must never be able to invent them.
    """

    def _resolve_entry(video_id: str) -> tuple:
        """Looks up the stored title and thumbnail for a video, if it still exists."""
        try:
            video = data_adapter.get_video_by_id(video_id) or {}
        except Exception as e:
            print(f"Could not look up metadata for {video_id}: {e}")
            return None, None
        return video.get("videoTitle"), video.get("videoThumbnail")

    @tool
    def get_video_queue() -> list:
        """Get the current watch queue as a list of YouTube video IDs, in order."""
        return redis_client.get_video_queue()

    @tool
    def add_video(video_id: str) -> str:
        """Append a video to the end of the queue. video_id must be the 11-character
        YouTube video ID (alphanumeric)."""
        try:
            title, thumbnail = _resolve_entry(video_id)
            add_result = redis_client.add_video(video_id, title, thumbnail)
            if add_result is None:
                return f"Could not add {video_id} - it either exists in the list already \
                    or is not valid"
            return f"Added {video_id}"
        except (TypeError, ValueError) as e:
            return f"Rejected: {e}"

    @tool
    def remove_video(video_id: str) -> str:
        """Remove every occurrence of a video from the queue."""
        try:
            redis_client.remove_video(video_id)
            return f"Removed {video_id}"
        except (TypeError, ValueError) as e:
            return f"Rejected: {e}"

    @tool
    def overwrite_video_at_index(video_id: str, queue_index: int) -> str:
        """Overwrite the video ID at a specific 0-based index in the queue."""
        try:
            title, thumbnail = _resolve_entry(video_id)
            redis_client.overwrite_video_at_index(video_id, queue_index, title, thumbnail)
            return f"Set index {queue_index} to {video_id}"
        except (TypeError, ValueError, IndexError) as e:
            return f"Rejected: {e}"

    @tool
    def get_video_index(video_id: str) -> str:
        """Find the 0-based index of a video in the queue, or a not-found message."""
        try:
            idx = redis_client.get_video_index(video_id)
            return str(idx)
        except (TypeError, ValueError) as e:
            return f"Rejected: {e}"

    @tool
    def replace_video(new_video_id: str, old_video_id: str) -> str:
        """Replace all instances of old_video_id with new_video_id."""
        try:
            title, thumbnail = _resolve_entry(new_video_id)
            redis_client.replace_video(new_video_id, old_video_id, title, thumbnail)
            return f"Replaced {old_video_id} with {new_video_id}"
        except (TypeError, ValueError) as e:
            return f"Rejected: {e}"

    @tool
    def set_video_queue(video_ids: list[str]) -> str:
        """Overwrite the entire queue with a new ordered list of video IDs."""
        entries = []
        for video_id in video_ids:
            title, thumbnail = _resolve_entry(video_id)
            entries.append(build_entry(video_id, title, thumbnail))
        redis_client.set_video_queue(entries)
        return f"Queue set to {len(video_ids)} videos"

    @tool
    def get_channels_of_tag(tag_name: str) -> list | str:
        """List the channel names that have the given tag."""
        try:
            result = data_adapter.get_channels_of_tag(google_id, tag_name)
            print(f"Channels of tag {tag_name} == {result}")
            return result
        except Exception as e:
            return f"Error: {e}"

    @tool
    def get_channel_by_name(channel_name: str) -> dict | str:
        """Look up a channel's full info (including its channelId) by its channel name.
        Use this to resolve a channel name (e.g. from get_channels_of_tag) into the
        channelId that get_video_of_channel needs."""
        try:
            channel = _clean_mongo_doc(data_adapter.get_channel_by_name(channel_name))
            if channel is None:
                return f"No channel found with name {channel_name!r}"
            print(f"Getting info for channel - {channel_name}:{channel}")
            return channel
        except Exception as e:
            return f"Error: {e}"

    @tool
    def get_watchlater_videos() -> list | str:
        """List the user's Watch Later videos."""
        try:
            return _clean_mongo_doc(data_adapter.get_watchlater_videos(google_id))
        except Exception as e:
            return f"Error: {e}"

    @tool
    def get_all_tracked_video() -> list | str:
        """List all videos the user is currently tracking."""
        try:
            return _clean_mongo_doc(data_adapter.get_all_tracked_video(google_id))
        except Exception as e:
            return f"Error: {e}"

    @tool
    def check_video_in_watchlater(video_id: str) -> bool | str:
        """Check whether a video ID is in the user's Watch Later list."""
        try:
            return data_adapter.check_video_in_watchlater(google_id, videoId=video_id)
        except Exception as e:
            return f"Error: {e}"

    @tool
    def check_video_in_favorite(video_id: str) -> bool | str:
        """Check whether a video ID is in the user's favorites."""
        try:
            return data_adapter.check_video_in_favorite(google_id, {"videoId": video_id})
        except Exception as e:
            return f"Error: {e}"

    @tool
    def check_video_in_tracked(video_id: str) -> bool | str:
        """Check whether a video ID is in the user's tracked videos."""
        try:
            return data_adapter.check_video_in_tracked(google_id, videoId=video_id)
        except Exception as e:
            return f"Error: {e}"

    @tool
    def get_channel_of_video(video_id: str) -> dict | str:
        """Get channel info (name, id, images) for the channel that owns a video."""
        try:
            return _clean_mongo_doc(data_adapter.get_channel_of_video(video_id))
        except Exception as e:
            return f"Error: {e}"

    @tool
    def get_video_of_channel(channel_id: str) -> list | str:
        """List known videos for a given channel ID."""
        try:
            result = _clean_mongo_doc(data_adapter.get_video_of_channel(channel_id))
            print(f"Videos of {channel_id} == {result}")
            return result
        except Exception as e:
            return f"Error: {e}"

    return [
        get_video_queue, add_video, remove_video, overwrite_video_at_index,
        get_video_index, replace_video,  # , set_video_queue,
        get_channels_of_tag, get_channel_by_name, get_watchlater_videos, get_all_tracked_video,
        check_video_in_watchlater, check_video_in_favorite, check_video_in_tracked,
        get_channel_of_video, get_video_of_channel,
    ]


# ---------------------------------------------------------------------------
# System prompt
# ---------------------------------------------------------------------------

def build_system_prompt(channel_tags: list[str], initial_queue: list[str]) -> str:
    return f"""You are a YouTube watch-queue assistant. You manage one user's video queue
by calling the provided tools - you never fabricate tool calls that aren't listed.

Known tag names for channels this user subscribes to: {channel_tags}
Current queue (video IDs, in order, if any) at the start of this request: {initial_queue}

Rules:
- A valid video ID is exactly 11 alphanumeric characters, and must strictly
  come frmo a tool. It should never be generated. Tools reject invalid IDs.
- Prefer add_video/remove_video/replace_video for small, targeted edits.
- Use get_channels_of_tag with one of the known tag names above to resolve a tag
  reference in the user's request to actual channel names, then get_channel_by_name
  to resolve a channel name to its channelId, then get_video_of_channel with that
  channelId to find videos for that channel.
- Call get_video_queue if you need to re-check the current state after making edits.
- If you are given a message describing a verification failure from a previous attempt,
  fix the described problem with minimal further edits - do not restart from scratch
  unless the failure message says the queue is completely invalid.
- When you believe the queue now correctly reflects the user's request, stop calling
  tools and reply with a short confirmation message."""

# - Use set_video_queue only when you need to replace the whole ordered list at once.

# ---------------------------------------------------------------------------
# Graph nodes
# ---------------------------------------------------------------------------

def make_agent_node(react_agent):
    def agent_node(state: QueueAgentState) -> dict:
        result = react_agent.invoke({"messages": state["messages"]})
        return {"messages": result["messages"]}
    return agent_node


def make_verify_node(redis_client: RedisYt):
    def verify_node(state: QueueAgentState) -> dict:
        current_queue = redis_client.get_video_queue()
        passed = (current_queue is not None) and (len(current_queue) != 0)
        # TODO: once per-video duration/time metadata is available, also verify
        # total run time / per-video duration constraints here.

        update = {
            "verification_passed": passed,
            "final_queue": current_queue,
            "retry_count": state["retry_count"] + 1,
        }

        if passed:
            update["verification_error"] = None
        else:
            error = "Verification failed: the queue is null."
            update["verification_error"] = error
            update["messages"] = [HumanMessage(
                content=(
                    f"{error} Current queue: {current_queue}. "
                    "Please fix this before finishing."
                )
            )]

        return update
    return verify_node


def route_after_verify(state: QueueAgentState) -> Literal["retry", "success", "give_up"]:
    if state["verification_passed"]:
        return "success"
    if state["retry_count"] >= state["max_retries"]:
        return "give_up"
    return "retry"


def make_finalize_success_node(redis_client: RedisYt):
    def finalize_success_node(state: QueueAgentState) -> dict:
        if redis_client.isLocal:
            redis_client.merge_local_to_prod()
        return {"success": True}
    return finalize_success_node


def finalize_failure_node(state: QueueAgentState) -> dict:
    return {"success": False}


# ---------------------------------------------------------------------------
# Graph construction
# ---------------------------------------------------------------------------

def build_outer_graph(react_agent, redis_client: RedisYt):
    builder = StateGraph(QueueAgentState)

    builder.add_node("agent", make_agent_node(react_agent))
    builder.add_node("verify", make_verify_node(redis_client))
    builder.add_node("finalize_success", make_finalize_success_node(redis_client))
    builder.add_node("finalize_failure", finalize_failure_node)

    builder.add_edge(START, "agent")
    builder.add_edge("agent", "verify")
    builder.add_conditional_edges(
        "verify",
        route_after_verify,
        {"retry": "agent", "success": "finalize_success", "give_up": "finalize_failure"},
    )
    builder.add_edge("finalize_success", END)
    builder.add_edge("finalize_failure", END)

    return builder.compile(checkpointer=MemorySaver())


# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------

def run_queue_agent(googleID: str, user_prompt: str) -> dict:
    is_local = os.getenv("YT_AGENT_REDIS_LOCAL", "0") == "1"
    max_retries = int(os.getenv("YT_AGENT_MAX_RETRIES", "3"))

    redis_client = RedisYt(google_id=googleID, local=is_local)
    channel_tags = data_adapter.get_all_tag_names(googleID)
    initial_queue = redis_client.get_video_queue()

    tools = build_tools(redis_client, googleID)
    llm = ChatOpenRouter(model=MODEL_ID, rate_limiter=rate_limiter)
    react_agent = create_agent(
        llm, tools, system_prompt=build_system_prompt(channel_tags, initial_queue),
    )

    graph = build_outer_graph(react_agent, redis_client)

    initial_state: QueueAgentState = {
        "user_prompt": user_prompt,
        "channel_tags": channel_tags,
        "initial_queue": initial_queue,
        "messages": [HumanMessage(content=user_prompt)],
        "retry_count": 0,
        "max_retries": max_retries,
        "verification_passed": False,
        "verification_error": None,
        "final_queue": None,
        "success": False,
    }

    result = graph.invoke(
        initial_state,
        config={"configurable": {"thread_id": str(uuid.uuid4())}},
    )

    return {
        "success": result["success"],
        "final_queue": result["final_queue"],
        "verification_error": result["verification_error"],
        "retry_count": result["retry_count"],
    }


if __name__ == "__main__":
    # os.environ.setdefault("YT_AGENT_REDIS_LOCAL", "1")
    fake_google_id = "dev-user-1"
    user_prompt = input("What should I do to the queue?")
    # user_prompt = "Add test123test to the queue and do the following: " + user_prompt
    print("Chosen todo:", user_prompt)
    # redis queue key is "smoketest-user_queue"
    output = run_queue_agent(fake_google_id, user_prompt)
    print(output)
