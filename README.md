# Ignite / API Server Dynamic Grid Demo

This is a sample project for building an igxGrid dynamically by querying the metadata from API Server endpoints.

## Installation

Use [npm](https://www.npmjs.com/) to install the package.

```
npm install
```

Place chinook.db (sample SQLite database) in a local accessible to your API Server instance.

## Connect to chinook.db

In the API Server admin console, navigate to Settings -> Connections and add a SQLite connection. Set the database connection property to the location of the chinook.db file.

## Authenticate

Set `const authtoken` in */src/app/grid/services/remoteService.ts* to the auth token for an API Server user with access to the SQLite connection.

## Notes

The */api.rsc/* endpoint and the resource endpoints (e.g. */api.rsc/myResource*) return pure JSON. The *$metadata* endpoint returns OData spec XML, which can be cast as JSON using the *\@JSON* URL parameter. The metadata is returned in a format like below. The private `updateGrid` method in */src/app/grid/grid-sample-4\grid-sample-4.component.ts* shows how to drill down into the metadata to parse out the column names and data types and build a JSON object.

```
{
  "items": [
    {
      "odata:cdatatype": [
        "string",
        "int",
        "int"
      ],
      "odata:cdescription": [
        "",
        "",
        ""
      ],
      "odata:cname": [
        "Title",
        "ArtistId",
        "AlbumId"
      ],
      "odata:csize": [
        "160",
        "19",
        "19"
      ],
      "odata:iskey": [
        "False",
        "False",
        "True"
      ],
      "odata:isnullable": [
        "False",
        "False",
        "False"
      ],
      "odata:kind": "EntitySet",
      "odata:methods": "get, post, put,merge,patch, delete",
      "odata:relationships": [
        "",
        "",
        ""
      ],
      "odata:table": "albums",
      "odata:type": "table"
    }
  ]
}
```
