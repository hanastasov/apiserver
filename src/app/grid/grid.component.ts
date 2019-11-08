import { Component, OnInit, ViewChild, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { RemoteDataService } from '../services/remoteData.service';
import { IgxGridComponent, IgxToastComponent, IgxTransactionService, IgxGridTransaction,
  IgxDatePickerComponent, IgxColumnComponent } from 'igniteui-angular';
import { BehaviorSubject} from 'rxjs';
import { ORDERS_DATA, PRODUCTS_DATA } from 'src/localData/northwind';

const TABLE_PREFIX = 'northwind_dbo_';
const PRODUCTS = `${TABLE_PREFIX}Products`;
const ORDERS = `${TABLE_PREFIX}Orders`;

interface Product {
    Id: number;
    Name: string;
}

@Component({
    providers: [RemoteDataService, { provide: IgxGridTransaction, useClass: IgxTransactionService }],
    selector: 'app-grid',
    templateUrl: './grid.component.html',
    styleUrls: ['./grid.component.scss']
})

export class GridComponent implements OnInit, OnDestroy {
    public productsData: any;
    public chartType = 'Line';
    public showLoader = false;
    public showGridLoader = false;
    public ordersGridIsLoading = false;
    public product: Product;
    public allDetailsFields: any;

    private _ordersDetailsData = new BehaviorSubject([]);
    private _ordersTimelineData = new BehaviorSubject([]);
    private _detailsFields = new BehaviorSubject([]);

    public ordersDetailsData = this._ordersDetailsData.asObservable();
    public ordersTimelineData = this._ordersTimelineData.asObservable();
    public detailsFields = this._detailsFields.asObservable();

    private _prodsRequest$: any;
    private _ordersRequest$: any;
    private _detailsFieldsRequest$: any;

    private pid: number;
    private fields: string[];

    @ViewChild('productsGrid', { read: IgxGridComponent, static: true }) public productsGrid: IgxGridComponent;

    constructor(private _remoteService: RemoteDataService, public cdr: ChangeDetectorRef) { }

    /**
     * Fetch metadata from the ORDERS table and binds the #columnsCombo
     * Fetch data from the PRODUCTS table and binds the #productsGrid
     */
    public ngOnInit(): void {
        this._detailsFieldsRequest$ = this._remoteService.getMetadata(ORDERS, (data) => {
            this.allDetailsFields = data;
        });
        this._prodsRequest$ = this._remoteService.getData(PRODUCTS);
        this._prodsRequest$.subscribe({
            next: (data: any) => {
              this.populateProductsGrid(data.value);
            },
            error: () => this.populateProductsGrid(PRODUCTS_DATA)
        });
    }

    public initColumns(column: IgxColumnComponent) {
        if (column.field === 'OrderDate' || column.field === 'ShippedDate' || column.field === 'RequiredDate') {
            column.formatter = this.formatDate;
        }
    }

    /**
     * cellSelection evend handler for the #productsGrid
     * When a cell/row is selected, fetch related data for the selected record from the ORDERS table
     */
    public cellSelection(evt) {
        if (this._detailsFieldsRequest$) {
            this._detailsFieldsRequest$.unsubscribe();
        }
        const cell = evt.cell;
        this.product = {Id: cell.row.rowID.ProductID, Name: cell.row.rowID.ProductName };
        this.showLoader = true;
        this.showGridLoader = true;
        this.productsGrid.selectRows([cell.row.rowID], true);
        this.pid = cell.row.rowID.ProductID;
        this.getOrderDetailsData(this.pid);
    }

    public comboItemSelected(event: any) {
      // when a new field in the combo is selected, fetch the data so that it gets displayed in the grid
      this.getOrderDetailsData(this.product.Id, event.newSelection);
    }

    private populateProductsGrid(data: any[]) {
      this.productsGrid.isLoading = false;
      this.productsGrid.data = data;
      this.productsGrid.height = '80%';
    }

    /**
     * Fetches order details data for product with id `pid`
     */
    private getOrderDetailsData(pid: number, fields?: string[], expandRel?: string) {
          this.ordersGridIsLoading = true;

          // initially those are the fields displayed in the #ordersGrid
          // if request comes from the comboItemSelected, then fields are added to the initial collection
          const baseFields = ['OrderID', 'OrderDate', 'ShipCountry', 'Freight'];
          fields = this.fields = fields ?  fields : baseFields;
          expandRel = expandRel ? expandRel : 'Details';

          // populate the #columnsCombo for the #ordersGrid
          this._detailsFields.next(this.allDetailsFields.filter(value => fields.includes(value.field)));

          // Fetch data both from the ORDERS and ORDER_DETAILS tables in a single joined response
          // Populates the #ordersGrid, the timeline chart and the pie chart
          this._ordersRequest$ = this._remoteService.getData(ORDERS, fields, expandRel);
          this._ordersRequest$.subscribe({
              next: (respData: any) => {
                  // TODO Filter the request ??
                  const dataForProduct = this.flattenResponseData(respData.value, pid, fields);
                  this.populateOrdersGrid(dataForProduct);
                  this.populateTimelineChart(dataForProduct);
              },
              // on remote data service error, bind local data
              error: err => {
                const dataForProduct = this.flattenResponseData(ORDERS_DATA, pid, fields);
                this.populateOrdersGrid(dataForProduct);
                this.populateTimelineChart(dataForProduct);
              }
          });
    }

    /**
     * Pass data to populate the #ordersGrid
     */
    private populateOrdersGrid(data: any[]) {
        this._ordersDetailsData.next(data);
        this.ordersGridIsLoading = false;
        this.showGridLoader = false;
    }

    /**
     * Pass data to populate the timeline chart
     */
    private populateTimelineChart(data: any[]) {
        // for the timeline chart, take only OrderDate and Quantity fields and put it in a new collection
        const orderDetailsForProduct = data.map((rec => {
          return { 'OrderDate': new Date(rec.OrderDate), 'Quantity': rec.quantity};
          // return { 'OrderDate': new Date(rec.OrderDate), 'Quantity': rec.Quantity};
        }));
        this._ordersTimelineData.next(orderDetailsForProduct);
        this.showLoader = false;
    }


    /**
     * Flatten the joined response from ORDERS and ORDERS_DETAILS tables into a flat object
     */
    private flattenResponseData(respData: any, pid: number, fields: string[]) {
      // filter only the records for the corresponding ProductID
      const dataForProduct = respData.filter((rec) =>
          rec.details[0].productid === pid
      // take out the values stored in the details object and return flat object
      ).map(((rec, index) => {
          const detailsDataObj = respData[index].details[0];
          const dataObj = {};
          fields.forEach(f => {
            dataObj[f] = rec[f];
          });
          return { ...dataObj, ...detailsDataObj};
      }));

      return dataForProduct;
    }

    public formatDate(val: string) {
      if (!!val) {
        return new Date(Date.parse(val)).toLocaleDateString('US');
      }
    }

    public formatDateLabel(item: any): string {
      return new Date(Date.parse(item.OrderDate)).toLocaleDateString('US');
    }

    public formatNumber(value: number) {
        return value.toFixed(2);
    }

    public formatCurrency(value: number) {
        return '$' + value.toFixed(2);
    }

    get showCharts(): boolean {
      return !this.showGridLoader && this.rowIsSelected;
    }

    get rowIsSelected(): boolean {
      return this.productsGrid.selectedRows().length > 0;
    }

    public ngOnDestroy() {
      if (this._prodsRequest$) {
          this._prodsRequest$.unsubscribe();
      }
      if (this._ordersRequest$) {
          this._ordersRequest$.unsubscribe();
      }
      if (this._detailsFieldsRequest$) {
        this._detailsFieldsRequest$.unsubscribe();
      }
    }
}
