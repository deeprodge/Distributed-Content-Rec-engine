import json
import os
import base64
from tqdm import tqdm
import requests

# Add your Bing Search V7 subscription key and endpoint as environment variables or replace them directly
subscription_key = os.environ.get('BING_SEARCH_V7_SUBSCRIPTION_KEY', '28e75e35b81147d0852f8f9ddf9f5aae')
endpoint = os.environ.get('BING_SEARCH_V7_ENDPOINT', 'https://api.bing.microsoft.com') + "/v7.0/images/search"

if not subscription_key or not endpoint:
    raise ValueError("Please set the BING_SEARCH_V7_SUBSCRIPTION_KEY and BING_SEARCH_V7_ENDPOINT environment variables.")

# Load content.json
with open('content.json', 'r') as f:
    content = json.load(f)

output_data = []  # To store the output JSON entries

# Function to download the image
def download_image(image_url, _id):
    try:
        # Fetch the image
        image_response = requests.get(image_url)
        image_response.raise_for_status()

        # Save the image locally
        image_filename = f"{_id}.jpg"
        with open(image_filename, 'wb') as img_file:
            img_file.write(image_response.content)

        # Convert the image to base64
        with open(image_filename, 'rb') as img_file:
            image_base64 = base64.b64encode(img_file.read()).decode('utf-8')

        return image_base64
    except Exception as ex:
        # If downloading the image fails, return None
        return None

# Iterate over descriptions and perform Bing Image Search
for entry in tqdm(content, desc="Processing Images", unit="image"):
    _id = entry['_id']
    description = entry['description']

    # Remove emojis and ensure description is clean
    description = description.encode('ascii', 'ignore').decode('ascii')

    # Set query parameters for Bing Image Search
    params = {'q': description, 'mkt': 'en-US', 'license': 'public', 'imageType': 'photo'}
    headers = {'Ocp-Apim-Subscription-Key': subscription_key}

    try:
        # Call the API
        response = requests.get(endpoint, headers=headers, params=params)
        response.raise_for_status()
        search_results = response.json()

        # Iterate through all search results until an image is successfully downloaded
        if 'value' in search_results and len(search_results['value']) > 0:
            for image_result in search_results['value']:
                image_url = image_result['contentUrl']
                image_base64 = download_image(image_url, _id)

                if image_base64:
                    # Add entry to output JSON and break the loop
                    output_data.append({
                        "_id": _id,
                        "description": description,
                        "image": image_base64
                    })
                    break
            else:
                print(f"No valid image found for {_id}")
        else:
            print(f"No image results found for {_id}")

    except Exception as ex:
        print(f"Error processing {_id}: {ex}")

# Save the output JSON
with open('output.json', 'w') as f:
    json.dump(output_data, f, indent=4)

print("Processing completed. Images and JSON saved.")
