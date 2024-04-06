import datetime
import json


def remove_trailing_commas(fileName):
    curr = ""
    with open(fileName, "r") as f:
        curr = f.read()[0:-3] + "]}"
    with open(fileName, "w") as f:
        f.write(curr)
    print("Finished with", fileName)


def call_all_remove_trailing_commas():
    remove_trailing_commas("automaticVideoIdInfo.json")
    remove_trailing_commas("automaticChannelNameInfo.json")
    remove_trailing_commas("automaticChannelIdInfo.json")
    remove_trailing_commas("automaticChannelImageInfo.json")
    remove_trailing_commas("automaticVideoTitleInfo.json")


def add_channels_to_update_list(updateFilePath):
    # For example:
    # updateFilePath = "./updateScheduleFiles/updateMonthly.json"
    with open("updateScheduleFiles/formatFile.txt", "r") as f:
        channels = f.readlines()
        channels = [x.rstrip("\n") for x in channels]

    # Confirm all exist in channels.txt
    with open("automaticChannelNameInfo.json", "r") as f:
        officialNames = f.read()
        # print(officialNames)

    writeOfficial = True
    for testName in channels:
        if testName not in officialNames:
            writeOfficial = False
            print(testName,"is not in the official list")

    if writeOfficial:
        print("Writing official")
        with open(updateFilePath, "w") as f:
            f.write(json.dumps({"channelNames": channels}))


def check_text_in_file(text, fileName, doHalves, doFirstHalf):
    with open(fileName, "r") as f:
        fileText = f.read()
        if doHalves:
            fileText = json.loads(fileText)
            fileText = fileText[list(fileText.keys())[0]]
            middleIdx = int(len(fileText) / 2)
            if doFirstHalf:
                fileText = fileText[0:middleIdx]
            else:
                fileText = fileText[middleIdx::]
    # return fileText
    return text in fileText


def main():
    # call_all_remove_trailing_commas()
    # in_there = check_text_in_file("Mathemaniac", "./updateScheduleFiles/updateMonthly.json",
    #                               doHalves=True,
    #                               doFirstHalf=False)
    # doIt = (int(datetime.datetime.now().day) % 2) == 0
    print(type(Exception))
    print(type(KeyError))


if __name__ == "__main__":
    main()
