import { Component, OnInit, ViewChild, ChangeDetectorRef, OnDestroy, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { RemoteDataService } from '../services/remoteData.service';
import { IgxGridComponent, IgxTransactionService, IgxGridTransaction, IgxColumnComponent,
    IGridEditEventArgs } from 'igniteui-angular';
import { BehaviorSubject} from 'rxjs';
import { ORDERS_DATA, PRODUCTS_DATA } from 'src/localData/northwind';
import { AddRowComponent } from '../grid-add-row/addrow.component';

const TABLE_PREFIX = 'northwind_dbo_';
const PRODUCTS = `${TABLE_PREFIX}Products`;
const ORDERS = `${TABLE_PREFIX}Orders`;
const ORDERS_DETAILS = `${TABLE_PREFIX}OrderDetails`;
const PKEY = 'ProductID';

@Component({
    providers: [RemoteDataService, { provide: IgxGridTransaction, useClass: IgxTransactionService }],
    selector: 'app-grid',
    templateUrl: './grid.component.html',
    styleUrls: ['./grid.component.scss']
})

export class GridComponent implements OnInit, OnDestroy {
    public productsData: any[];
    public chartType = 'Line';
    public pkey = PKEY;
    public selectionMode = 'single';
    public showLoader = false;
    public showGridLoader = false;
    public ordersGridIsLoading = false;
    public productName: string;
    public allDetailsFields: any;
    public hideOverlay = true;
    public rowIsSelected = false;

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
    @ViewChildren('ordersGrid', { read: IgxGridComponent }) public ordersGrid: QueryList<IgxGridComponent>;
    @ViewChild('addRow', { read: AddRowComponent, static: false }) public addNewRow: AddRowComponent;

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
            next: (data: any[]) => {
              this.populateProductsGrid(data);
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
     * rowSelection evend handler for the #productsGrid
     * When a row is selected, fetch related data for the selected record from the ORDERS table
     */
    public handleRowSelection(evt) {
        if (!evt.event) {
            return;
        }
        if (evt.event.srcElement.tagName === 'IGX-ICON') {
            evt.newSelection = evt.oldSelection;
            return;
        }
        if (this._detailsFieldsRequest$) {
            this._detailsFieldsRequest$.unsubscribe();
        }
        const row = this.productsGrid.getRowByKey(evt.newSelection[0]);
        if (row) {
            this.rowIsSelected = true;
            this.productName = row.rowData.ProductName;
            this.pid = row.rowID;
            this.showLoader = true;
            this.showGridLoader = true;
            this.getOrderDetailsData(this.pid);
        }
    }

    public startEditMode() {
        this.productsGrid.getRowByKey(this.pid).cells.first.setEditMode(true);
    }

    public comboItemSelected(event: any) {
        // when a new field in the combo is selected, fetch the data so that it gets displayed in the grid
        this.getOrderDetailsData(this.pid, event.newSelection);
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
            next: (respData: any[]) => {
                // TODO Filter the request ??
                const dataForProduct = this.flattenResponseData(respData, pid, fields);
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
        (this.ordersGrid.first as IgxGridComponent).reflow();
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
    private flattenResponseData(respData: any[], pid: number, fields: string[]): any[] {
        // filter only the records for the corresponding ProductID
        const dataForProduct = respData.filter((rec) =>
            rec.details[0].productid === pid
        // take out the values stored in the details object and return flat object
        ).map(((rec, index) => {
            const detailsDataObj = rec.details[0];
            const dataObj = {};
            fields.forEach(f => {
              dataObj[f] = rec[f];
            });
            return { ...dataObj, ...detailsDataObj};
        }));

        return dataForProduct as any[];
    }

    public formatDate(val: string) {
        if (!!val) {
          return new Date(Date.parse(val)).toLocaleDateString('US');
        }
    }

    public onRowEdit(event: IGridEditEventArgs) {
      const editedRecord = event.newValue;
      this._remoteService.editData('northwind_dbo_Products', editedRecord).subscribe({
          next: (metadata: any) => {
            //   this.productsGrid.updateRow(editedRecord, event.oldValue.ProductID);
            this.productsGrid.transactions.commit(this.productsGrid.data);
          },
          error: err => {

          }
      });
  }

    public deleteRow(rowIndex: number) {
        this.productsGrid.isLoading = true;
        const rowID = this.productsGrid.getRowByIndex(rowIndex).rowData[PKEY];
        const row = `${PKEY}(${rowID})`;

        this._remoteService.deleteData(ORDERS_DETAILS, row).subscribe({
            next: (metadata) => {
                this._remoteService.deleteData(PRODUCTS, row).subscribe({
                    next: (data) => {
                        this.addNewRow.hideOverlay = true;
                        this.productsGrid.deleteRowById(rowID);
                        this.productsGrid.transactions.commit(this.productsGrid.data);
                        if (rowID !== this.pid) {
                            this.productsGrid.selectRows([this.pid]);
                        }
                        this.productsGrid.isLoading = false;
                    },
                    error: err => {
                    }
                });
            },
            error: err => {

            }
        });
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

//     public undo() {
//       this.productsGrid.transactions.undo();
//     }

//     public redo() {
//       this.productsGrid.transactions.redo();
//     }

//   public commit() {
//     const newRows = this.productsGrid.transactions.getAggregatedChanges(true);
//     this.productsGrid.transactions.commit(this.productsGrid.data);
//     // this._remoteService.addData(newRows.map(rec => rec.newValue));
//   }

//   public discard() {
//     this.productsGrid.transactions.clear();
//   }
}
