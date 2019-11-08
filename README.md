# Ignite / API Server Northwind DEMO

## Running the Northwind page
1. Northwind database in SQL Server. Easisest way to install are 3 steps that are explained [here](https://businessimpactinc.com/blog/install-northwind-database/) or just execute the script to create it, the script is [here](https://raw.githubusercontent.com/microsoft/sql-server-samples/master/samples/databases/northwind-pubs/instnwnd.sql)

2. Go to the [`API Server`](http://localhost:8153/status.rst) and navigate to `Connections`, we need to add connection for the Northwind database.
![alt text](https://i.ibb.co/59ysD40/sql.png)


3. Next go to `Resources` and add the `Products`, `Orders` and `Order details` tables from the Northwind connection.
![alt text](https://i.ibb.co/9WrRzgN/Capt2ure.png)

4. Go to [API Server Settings/User](http://localhost:8153/settings.rst#userFormTab), and and new user. Copy the auththoken created.
(https://i.ibb.co/wzHy16p/Capture.png)
5. Go to `grid.component.ts` file, replace the value of the `auththoken` variable with the value copied in Step 4.
6. Go to [API Server Settings/Server](http://localhost:8153/settings.rst#serverFormTab) and check enable CORS:
(https://i.ibb.co/fqvkGV4/Capture2.png)
7. Go to [Api Server Settings](http://localhost:8153/settings.rst), click Edit icon on the northwind_dbo_Orders resource.
8. In the dialog opened, replace the record for OrderID with the following:

attr name="OrderID" key="true" type="int" columnsize="10" isNullable="false" readonly="false" relationships="Details(northwind_dbo_Order Details.OrderID)" desc="" /

This actually defines a relationship between the Order and Order_Details table, which allows the app to get data from the two tables via single http request.


9. Run the app
```
npm install
ng serve -o
```

NOTE:If after selecting a row in the first grid results in erros (this is most probably due to a bug in API server, which seems to return a slightly different structured (only when doing an expand query), do the following:

`populateTimelineChart` in `grid.component.ts`:
- "return { 'OrderDate': new Date(rec.OrderDate), 'Quantity': rec.quantity};" - Capitalize the `quantity`
`flattenResponseData` method in `grid.component.ts`:
- capitalize "details" and "productsID" fields where used, also debug to see if you need to unrap the first value from details, or just take it as a property like Details.ProductID


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
