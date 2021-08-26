# gpea-gsheet-toolkit

This is a toolkit for handling google sheet features.

## Google Sheet As Database

While building petition pages, we usually need to save extra data. ex, the comment from supporters. It’s too heavy to have a real database. 

That’s why we decide to use the google sheet as our DB. By using google sheet, we have following benefits:

* Everyone knows how to use it.

* Nice permission controls. 

* Easy to use and easy to maintain.

* No extra server or services required. 

In the traditional way, we have to share the whole google sheet to the world in order to access it from our client side by javascript. It’s not safe to expose the google sheet links and whole gogole sheet. That’s why we build another layer to have better permission controls.

By using this feature,

* You can turn any google sheet into DB without sharing to the world. You only need to share with a pre-defined google service account. In GPEA, please share with `gpea-syncer@gpea-engage.iam.gserviceaccount.com`

* Keep your data and google sheet safe! Never expose your data to the world with public sharing.

* Now the endpoint support SELECT and INSERT features. 

### Setup guide

1. Prepare a schema data extension and share to the service account. Please refer to [GPEA GSheet Toolkit Schemas](https://docs.google.com/spreadsheets/d/1yfIoKAJsz99fFMsfYznLXvjGRoZ20LaZ_Khz_ov4aHM/edit#gid=0).

2. Generate a google service account key file

Please follow [this instruction (step 3)](https://hackernoon.com/how-to-use-google-sheets-api-with-nodejs-cz3v316f) to have the key file. 

3. Move your key file into `secrets` folder.

4. Copy the `.env.sample` file as `.env` and update the content.

```

# links to your key file

GOOGLE_APPLICATION_CREDENTIALS=./secrets/gpea-syncer@gpea-engage.iam.gserviceaccount.com.json 

# google sheet id of your schema file

GSHEET_TOOLKIT_SCHEMA_SPREADSHEET_ID=1yfIoKAJsz99fFMsfYznLXvjGRoZ20LaZ_Khz_ov4aHM 

```

5. Start the server

```

npm install

npm dev

```