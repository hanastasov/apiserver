# Ignite / API Server Northwind DEMO

## Running the Northwind page
1. Northwind database in SQL Server. Easisest way to install are 3 steps that are explained below:
1.1 Download [Northwind database](https://cta-service-cms2.hubspot.com/ctas/v2/public/cs/c/?cta_guid=ebcbe6eb-2891-49b0-8b19-ba5f72c595d6&placement_guid=bbbd8fcc-8408-4cfa-a91d-4fe667f90829&portal_id=207100&canon=&redirect_url=APefjpFLTYeoBUM7EqyPJP71R1Fc9bvHDH5Cqth0-lyqhjGcvPHZ-P5_BjkAfDfsFI2wX7QLVzfFYr0aGJjZIGbxE3nj9gq3ebxMnmpRC4MhasXYCFSEbw_oKhWeweiGT5d1_8Xz0bfSV9uHTFC7kbPTYiGCtCzvM4FTcl3laYclDB-v6_TG4Js&click=a823892a-7cee-4ab2-9fa8-51dcfffa99c4&hsutk=&signature=AAH58kGLcpMwYeqtsCfzjF_pyF1Iq99ljg) and save it to:
C:\Program Files\Microsoft SQL Server\MSSQL11.MSSQLSERVER\MSSQL\DATA”.
1.1 Follow the detailed steps with screenshots [here](https://businessimpactinc.com/blog/install-northwind-database/)

2. Go to the [`API Server`](http://localhost:8153/status.rst) and navigate to `Connections`, we need to add connection for the Northwind database.
![alt text](https://i.ibb.co/59ysD40/sql.png)


3. Next go to `Resources` and add the `Products`, `Orders` and `Order details` tables from the Northwind connection.
![alt text](https://i.ibb.co/9WrRzgN/Capt2ure.png)

4. Run the app
```
npm install
ng serve -o
```


# Ignite / API Server Dynamic Ignite Page

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
