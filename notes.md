https://www.cdata.com/apiserver/

### AUTHENTICATION

By default, authentication to the API is done through `Basic authentication` with the user/tokens created in the API Server, in `Settings > Users`. You can also pass the token as a HTTP header called ‘x-cdata-authtoken’ instead. So after allowing CORS, you need to add this header in the `remoteService` class:

```typescript
const HTTPOPTIONS = {headers : new HttpHeaders({ 'x-cdata-authtoken': 'my_authtoken' })}
```
and then add this object to all HTTP calls in the class.

Another way to authenticate the API call is to pass the `authtoken` as a URL parameter. You’ll need to enable this in the `API Server`’s `settings.cfg`, by adding `“AllowAuthTokenInURL = true”`. You can then include the authtoken in your URL as such:
```typescript
const DATA_URL: string = "http://localhost:8153/api.rsc/@my_authtoken/Accounts";
```

The API Server does support Windows authentication if required



MONGODB
You’ll need to install the CData ADO.NET provider for MongoDB. Once it’s installed, the API Server should be able to detect it when listing the connection sources. You can download the provider from here:
https://www.cdata.com/drivers/mongodb/download/ado/

### OData $expand functionality
You can define a relationship between the Order and Order_Details table, and this will allow you to get data from related entities in one OData requests. For this example, click on the Edit icon for the Northwind_dbo_Order resource, and on the primary ID line (OrderID), add the ‘relationships’ attribute:

<attr name="OrderID" key="true" type="int" columnsize="10" isNullable="false" readonly="false" relationships="Details(Northwind_dbo_Order_Details.OrderID)" desc="" />

You can then retrieve data from both endpoints by using the OData $expand keyword:
    `api.rsc/Nortwind_dbo_Order(10248)?$expand=Details`

You can set this up for related entities in any data source, SQL Server, MongoDB, Sharepoint, etc. API Server drivers will handle the SQL Join query, and you can see this query in the Status tab of the API Server to give you an idea of what is happening behind the API Server. [Documentation](http://cdn.cdata.com/help/BWD/odata/pg_apiexpand.htm) also mentions different cardinality options.


### FILTER

Does the API Server provide a way to query records that were updated in a given timeframe ? 

- The best way to do this is by adding a filter in the OData query. The requirement is that the data source exposes a date field which lets us know the last time this data has changed (e.g. ‘LastUpdatedAt’, ‘LastModified’, …). Those fields can be configured to be automated in a RDBMs for example. Some data sources, such as Sharepoint, also exposes such fields by default.

You can then use a filter on this field to retrieve data that has changed since a specific date:
 `api.rsc/my_table?$filter=LastUpdatedAt gt '2018-02-12T00:00:00'`

### HOSTING

To expose the API server over the network, make sure that the Windows firewall allows connection on port 8153, and that other networking tools on your network, such as proxies and hardware firewalls, must also allow the hosting server to receive requests on port 8153. 

You can host the API Server on a hosting service, such as Azure, AWS EC2, or Heroku.
https://www.cdata.com/kb/articles/odata-azure.rst
https://www.cdata.com/kb/articles/odata-amazon.rst
https://www.cdata.com/kb/articles/odata-heroku.rst

One thing we also recently added is the Amazon AMI, which is essentially an EC2 VM which comes with the API Server pre-installed, and requires a minimum amount of configuration, and exposes an API which is already accessible over the internet:
https://www.cdata.com/kb/articles/apiserver-ami.rst

### DEPLOY
The Deploy feature is a way to export an API as a separate web-application, which you can then host on IIS, Tomcat, or other web-container. This can be useful for deploying an API behind a firewall, or maintaining Dev/QA/Prod branches of an APIs. One of the drawbacks of this feature, is this entirely separates the deployed API from the UI dashboard, so any configuration after the fact is very finicky

### SHARE POINT

Here’s how you can enable connectivity to SharePoint in the API Server when it is hosted in Azure. After copying the API Server installation files to the Azure FTP site, find the DLL file for the SharePoint driver, by default in `‘C:\Program Files\CData\CData ADO.NET Provider for SharePoint 2018\lib\4.0`’ called `‘System.Cdata.CData.Sharepoint.DLL’`. Copy this file in to the bin directory of the API Server in the Azure `(‘site/wwwroot/bin/’)`.

The second step is to edit the API Server’s `Web.config` on the Azure site. In the `<DbProviderFactories>` section, add the following line:
```html
<add name="CData ADO.NET Provider for SharePoint" invariant="System.Data.CData.SharePoint" description="CData ADO.NET Provider for SharePoint" type="System.Data.CData.SharePoint.SharePointProviderFactory, System.Data.CData.SharePoint" />
 ```
After saving this change, restart the API Server web-app from the Azure portal, and the SharePoint options will appear when creating a new connection in the API Server.

Licensing is a bit trickier on Azure. Since the API Server relies on the network name of the machine to validate license, when the Azure web-app restarts, a mismatch in network name can cause the licensing check to fail. To get around this, we use runtime keys. I’ve created trial RTKs for both the API Server and the Sharepoint driver, which should work in any case:
API Server - Copy the attached file to the `‘wwwroot/app_data’`
Sharepoint - Enter the following value in the `RTK` field, under the `Advanced` properties of the Sharepoint connection:
`52535244415A30323232313933305745425452314131000000000000000000000000000000000000494E465241474953000039544D5445383430484552500000`

### MEMORY CACHING

Go to the `Settings > Resource` page. Click on the edit icon of the resource for which you’d like to enable caching. In the second line, right above the <rsb:info> block, add the following line:
```html
<rsb:cache key="[_meta.odata:table]-[_meta.odata:query]" duration="1" />
```
And save the schema. The duration is the value in minutes of how long the cache will stay valid for.

For each new query, the API Server will save a cached response. For each subsequent query on the same table with the same filters, the API Server will use data from the cache instead of re-querying from the driver, until the cache expires.

### Filter inside Expanded Entities

API Server doesn’t support filters or other operation keywords inside of and expanded entity at this time, even though it is valid in OData 4.0. We didn’t plan on implementing this functionality in the first phase of the $expand feature. 