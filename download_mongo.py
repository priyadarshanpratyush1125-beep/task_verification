import urllib.request
import zipfile
import os

url = "https://fastdl.mongodb.org/windows/mongodb-windows-x86_64-8.0.4.zip"
zip_path = ".mongodb/mongodb.zip"

print("Downloading MongoDB...")
urllib.request.urlretrieve(url, zip_path)
print("Download complete. Extracting...")
with zipfile.ZipFile(zip_path, 'r') as zip_ref:
    zip_ref.extractall(".mongodb")
print("Extraction complete.")
