from random import randint


class Novel:
    def __init__(self, title, max_chapter, novel_base_link):
        self.title = title
        self.MAX_CHAPTER = max_chapter
        self.novel_base_link = novel_base_link
        self.random_chapter = randint(1, max_chapter)
        # TODO - use MongoDB to save the current chapter, then initialize this value when calling the class
        self.saved_current_chapter = max_chapter

    def generate_random_chapter(self):
        print("Generating...A new chapter...")
        curr_chapter = self.random_chapter
        while self.random_chapter == curr_chapter:
            self.random_chapter = randint(1, self.MAX_CHAPTER)
        return self.random_chapter

    def get_title(self):
        return self.title

    def get_chapter(self):
        return self.novel_base_link + "/chapter-" + str(self.random_chapter)

    def get_chapter_number(self):
        return self.random_chapter

    def set_saved_chapter(self, updated_chapter):
        self.saved_current_chapter = updated_chapter



def main():
    lotm = Novel(title="Lord of the Mysteries",
                 max_chapter=1432,
                 novel_base_link="https://www.lightnovelworld.com/novel/lord-of-the-mysteries-275")