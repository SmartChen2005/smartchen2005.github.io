from exif import Image
from fractions import Fraction
import os


# https://exif.readthedocs.io/en/latest/

projectName =input("Enter Project Name:")
directory = f'/Users/smartchen/Documents/GitHub/smartchen2005.github.io/portfolio/{projectName}/img'


def getEXIF(fileName):
    with open(fileName, 'rb') as ImageFile:
        img = Image(ImageFile)
    # camera model, lens model, aperture, exposure time, iso
    name = fileName[fileName.rindex("/") + 1:]
    date = img.datetime[0:10].split(":")
    return [name, img.model, img.lens_model, "f" + str(img.f_number),
            str(Fraction(img.exposure_time).limit_denominator(10000)) + 's',
            "iso" + str(img.photographic_sensitivity), date[0]+'/'+date[1]+'/'+date[2]]


def printAllPicsInfo(directory):
    for file in os.listdir(directory):
        if file[len(file) - 3:len(file)] == 'jpg' or file[len(file) - 4:len(file)] == 'jpeg':
            print(getEXIF(directory + '/' + file))

# printAllPicsInfo(directory)

fileList = []
for file in os.listdir(directory):
    if file[len(file) - 3:len(file)].lower() == 'jpg' or file[len(file) - 4:len(file)].lower() == 'jpeg':
        fileList.append(file)
fileList.sort()

for file in fileList:
    info = getEXIF(directory + "/" + file)
    if info[1][0:6] == "iPhone":
        info[2] = ""
        print(f"""
<div class="polaroid">
    <img src="img/{file}" style="width:100%">
    <div class="description">
        <p>{info[1]}<br>{info[3]} {info[4]} {info[5]}<br>{info[6]}</p>
    </div>
</div>""")
    else:
        print(f"""
<div class="polaroid">
    <img src="img/{file}" style="width:100%">
    <div class="description">
        <p>{info[1]}<br>{info[2]}<br>{info[3]} {info[4]} {info[5]}<br>{info[6]}</p>
    </div>
</div>""")