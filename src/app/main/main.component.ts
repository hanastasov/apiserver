import { Component, OnInit, ViewChild, OnDestroy, ViewChildren, QueryList } from '@angular/core';
import { RemoteDataService } from '../services/remoteData.service';
import { IgxGridComponent, IgxTransactionService, IgxGridTransaction, IGridEditEventArgs } from 'igniteui-angular';
import { Subscription} from 'rxjs';
import { AddRowComponent } from '../grid-add-row/addrow.component';
import { IOrderDetails, IProduct } from './interfaces';

const PKEY = 'ProductID';

export enum Tables {
    PRODUCTS = 'Products',
    ORDERS = 'Orders',
    ORDERS_DETAILS = 'OrderDetails'
}

@Component({
    providers: [RemoteDataService, { provide: IgxGridTransaction, useClass: IgxTransactionService }],
    selector: 'app-grid',
    templateUrl: './main.component.html',
    styleUrls: ['./main.component.scss']
})

export class MainComponent implements OnInit, OnDestroy {
    public productsData: IProduct[];
    public ordersDetailsData: IOrderDetails[];
    public ordersDetailsDataPerCountry = [];
    public ordersTimelineData = [];
    public allDetailsFields = [];
    public detailsFields = [];
    public pkey = PKEY;
    public showLoader = false;
    public showGridLoader = false;
    public ordersGridIsLoading = false;
    public productName = '';
    public rowIsSelected = false;
    public comboFields = ['OrderID', 'OrderDate', 'ShipCountry', 'Freight'];

    private _prodsRequest$ = new Subscription();
    private _ordersRequest$ = new Subscription();
    private _detailsFieldsRequest$ = new Subscription();
    private pid: number;

    @ViewChild('productsGrid', { read: IgxGridComponent, static: true }) public productsGrid: IgxGridComponent;
    @ViewChildren('ordersGrid', { read: IgxGridComponent }) public ordersGrid: QueryList<IgxGridComponent>;
    @ViewChild('addRow', { read: AddRowComponent, static: false }) public addNewRow: AddRowComponent;

    constructor(private _remoteService: RemoteDataService) { }

    /**
     * Fetch metadata from the ORDERS table and populates the #columnsCombo
     * Fetch data from the PRODUCTS table and populates the #productsGrid
     */
    public ngOnInit(): void {
        this._detailsFieldsRequest$ = this._remoteService.getMetadata(Tables.ORDERS).subscribe(data => {
            this.allDetailsFields = data;
        });
        this._prodsRequest$ = this._remoteService.getData(Tables.PRODUCTS).subscribe(data => {
            this.populateProductsGrid(data as IProduct[]);
        });
    }

    /**
     * rowSelection event handler for the #productsGrid
     * When a row is selected, fetch data from the ORDERS table
     */
    public handleRowSelection(evt) {
        if (!evt.event) {
            return;
        }
        if (evt.event.srcElement.tagName === 'IGX-ICON') {
            evt.newSelection = evt.oldSelection;
            return;
        }
        const row = this.productsGrid.getRowByKey(evt.newSelection[0]);
        if (row) {
            this.rowIsSelected = true;
            this.productName = row.rowData.ProductName;
            this.pid = row.rowID;
            this.showLoader = true;
            this.showGridLoader = true;

            // populate the #columnsCombo
            this.detailsFields = this.allDetailsFields.filter(value => this.comboFields.includes(value.field));
            this.getOrderDetailsData(this.pid, this.comboFields);
        }
    }


    /**
     * Start edit mode for row with corresponding id.
     */
    public startEditMode(id: number) {
        this.productsGrid.getRowByKey(id).cells.first.setEditMode(true);
    }

    public comboItemSelected(event: any) {
        // when a new field in the combo is selected, fetch the data so that it gets displayed in the grid
        if (!this.ordersGridIsLoading) {
            const fields = event.newSelection ?  event.newSelection : this.comboFields;
            this.detailsFields = this.allDetailsFields.filter(value => fields.includes(value.field));
            this.getOrderDetailsData(this.pid, fields);
        }
    }

    /**
     * Fetches data both from the ORDERS and ORDER_DETAILS tables for Product with id `pid`
     */
    private getOrderDetailsData(pid: number, fields) {
        this.ordersGridIsLoading = true;

        this._ordersRequest$ = this._remoteService.getData(Tables.ORDERS, fields, pid, this.pkey, 'Details').subscribe(data => {
            this.populateOrdersGrid(data as IOrderDetails[]);
            this.populatePieChart(data);
            this.populateTimelineChart(data);
        });
    }

    /**
     * Pass data to populate the #productsGrid
     */
    private populateProductsGrid(data: IProduct[]) {
        this.productsGrid.isLoading = false;
        this.productsData = data;
        this.productsGrid.height = '80%';
    }

    /**
     * Pass data to populate the #ordersGrid
     */
    private populateOrdersGrid(data: IOrderDetails[]) {
        this.ordersDetailsData = data;
        this.ordersGridIsLoading = false;
        this.showGridLoader = false;
        (this.ordersGrid.first as IgxGridComponent).reflow();
    }

    /**
     * Pass data to populate the Pie Chart
     */
    private populatePieChart(data: any[]) {
        const dataPerCountry = this.aggregateDataPerCountry(data);
        this.ordersDetailsDataPerCountry = dataPerCountry;
    }

    /**
     * Aggregates data per ShipCountry
     */
    private aggregateDataPerCountry(data: any[]): any[] {
        const result = data.reduce((prev, item) => {
            const newItem = prev.find((i) => {
                return i.ShipCountry === item.ShipCountry;
            });
            if (newItem) {
                newItem.Quantity += item.Quantity;
            } else {
                prev.push(item);
            }
            return prev;
        }, []);
        return result;
    }

    /**
     * Pass data to populate the timeline chart with OrderDate and Quanityty columns
     */
    private populateTimelineChart(data: any[]) {
        const orderDetailsForProduct = data.map((rec => {
          return { 'OrderDate': new Date(rec.OrderDate), 'Quantity': rec.Quantity};
        }));
        this.ordersTimelineData = orderDetailsForProduct;
        this.showLoader = false;
    }

    public onRowEdit(event: IGridEditEventArgs) {
      const editedRecord = event.newValue;
      this._remoteService.editData(Tables.PRODUCTS, editedRecord).subscribe({
          next: (metadata: any) => {
          },
          error: err => {
          }
      });
    }

    public deleteRow(rowIndex: number) {
        this.productsGrid.isLoading = true;
        const rowID = this.productsGrid.getRowByIndex(rowIndex).rowData[PKEY];
        const row = `${PKEY}(${rowID})`;

        this._remoteService.deleteData(Tables.ORDERS_DETAILS, row).subscribe({
            next: (metadata) => {
                this._remoteService.deleteData(Tables.PRODUCTS, row).subscribe({
                    next: (data) => {
                        this.addNewRow.hideOverlay = true;
                        this.productsGrid.deleteRowById(rowID);
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

    public undo() {
        this.productsGrid.transactions.undo();
    }

    public redo() {
        this.productsGrid.transactions.redo();
    }

    public commit() {
        this.productsGrid.transactions.commit(this.productsGrid.data);
    }

    public discard() {
        this.productsGrid.transactions.clear();
    }

    public get undoEnabled(): boolean {
        return this.productsGrid.transactions.canUndo;
    }

    public get redoEnabled(): boolean {
        return this.productsGrid.transactions.canRedo;
    }

    public get hasTransactions(): boolean {
        return this.productsGrid.transactions.getAggregatedChanges(false).length > 0;
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
}
