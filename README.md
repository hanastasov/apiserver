# Ignite / API Server Northwind DEMO

Steps below configure the API SErver, which enables an ODataService used in the sample. IF this service fails for some reason, the app connnects to local data that is inside the demo as JSON.

## Running the Northwind page

1. Northwind database in SQL Server.
Just run the script to execute the database, the script is [here](https://raw.githubusercontent.com/microsoft/sql-server-samples/master/samples/databases/northwind-pubs/instnwnd.sql)
Or follow  the 3 steps that are explained [here](https://businessimpactinc.com/blog/install-northwind-database/).

2. Go to the [`API Server/Settings/Connections`](http://localhost:8153/settings.rst#connectionFormTab) and add connection for the Northwind database:
![alt text](https://i.ibb.co/59ysD40/sql.png)

3. Next go to [`API Server/Settings/Resources`](http://localhost:8153/settings.rst#resourcesFormTab) and add the `Products`, `Orders` and `Order details` tables from the Northwind connection.
![alt text](https://i.ibb.co/9WrRzgN/Capt2ure.png)

4. Go to [`API Server Settings/User`](http://localhost:8153/settings.rst#userFormTab), and and new user. Copy the auththoken created.
![alt text](https://i.ibb.co/wzHy16p/Capture.png)
5. Go to `remoteData.service.ts` file, replace the value of the `auththoken` variable with the value copied in Step 4.
6. Go to [`API Server Settings/Server`](http://localhost:8153/settings.rst#serverFormTab) and check enable CORS:
![alt text](https://i.ibb.co/fqvkGV4/Capture2.png)
7. Go to [`API Server Settings`](http://localhost:8153/settings.rst), click Edit icon on the `northwind_dbo_Orders` resource.
8. In the dialog opened, find record for `OrderID` and add the following attribute inside the xml element:

'relationships="Details(northwind_dbo_Order Details.OrderID)"'

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
