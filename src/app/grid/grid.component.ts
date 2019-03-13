import { Component, OnInit, ViewChild, ChangeDetectorRef, AfterViewInit, OnDestroy } from '@angular/core';
import { RemoteFilteringService } from '../services/remoteData.service';
import { IgxGridComponent, IgxToastComponent, IgxTransactionService, IgxGridTransaction } from 'igniteui-angular';
import { BehaviorSubject} from 'rxjs';
import { ORDERS_DATA } from 'src/localData/northwind';

const TABLE_PREFIX = 'northwind_dbo_';
// const TABLE_PREFIX = 'CData_SharePoint_dbo_';
const MONGO_TABLE_PREFIC = 'CData_Northwind_';
const PRODUCTS = `${TABLE_PREFIX}Products`;
const ORDERS = `${TABLE_PREFIX}Orders`;
const ORDER_DETAILS = `${TABLE_PREFIX}Order+Details`;

interface IButton {
  ripple ?: string;
  label ?: string;
  disabled ?: boolean;
  togglable ?: boolean;
  selected ?: boolean;
  color ?: string;
  icon ?: string;
}

interface Product {
  Id?: number;
  Name: string;
}

class Button {
  private ripple: string;
  private label: string;
  private disabled: boolean;
  private togglable: boolean;
  private selected: boolean;
  private color: string;
  private icon: string;
  constructor(obj?: IButton) {
    this.ripple = obj.ripple || 'gray';
    this.label = obj.label;
    this.selected = obj.selected || false;
    this.togglable = obj.togglable;
    this.disabled = obj.disabled || false;
    this.color = obj.color;
    this.icon = obj.icon;
  }
}

@Component({
  providers: [RemoteFilteringService, { provide: IgxGridTransaction, useClass: IgxTransactionService }],
  selector: 'app-grid',
  templateUrl: './grid.component.html',
  styleUrls: ['./grid.component.scss']
})
export class GridComponent implements OnInit, AfterViewInit, OnDestroy {
  public remoteData: any;
  public detailsFields: any;
  public chartType = 'Line';
  public showLoader = false;
  public showGridLoader = false;
  public product: Product = {Name: '' };

  private _ordersData = new BehaviorSubject([]);
  private _ordersDetailsData = new BehaviorSubject([]);
  private _ordersTimelineData = new BehaviorSubject([]);

  public ordersData = this._ordersData.asObservable();
  public ordersDetailsData = this._ordersDetailsData.asObservable();
  public ordersTimelineData = this._ordersTimelineData.asObservable();

  public buttongrouphorizontal = [
    new Button({
    label: 'Home',
    }),
    new Button({
    label: 'products',
    selected: true
    }),
    new Button({
    label: 'documents',
    }),
    new Button({
    label: 'assignments',
    }),
  ];

  private _prodsRequest$: any;
  private _ordersRequest$: any;
  private _detailsFieldsRequest$: any;

  private addProductId = 0;


  @ViewChild('grid') public grid: IgxGridComponent;
  @ViewChild('toast') public toast: IgxToastComponent;

  constructor(private _remoteService: RemoteFilteringService, public cdr: ChangeDetectorRef) { }

  public ngOnInit(): void {
      this.remoteData = this._remoteService.remoteData;
      this.ordersDetailsData = this._ordersDetailsData.asObservable();
      this._detailsFieldsRequest$ = this._remoteService.getMetadata(ORDERS);
      this.detailsFields = this._remoteService.detailsFields;
  }

  public ngAfterViewInit() {
      this._prodsRequest$ = this._remoteService.getData(PRODUCTS);
  }

  public cellSelection(evt) {
    if (this._detailsFieldsRequest$) {
      this._detailsFieldsRequest$.unsubscribe();
    }
    const cell = evt.cell;
    this.product = {Id: cell.row.rowID.ProductID, Name: cell.row.rowID.ProductName };
    this.showLoader = true;
    this.showGridLoader = true;
    this.grid.selectRows([cell.row.rowID], true);
    this.getDetailsData(cell.row.rowID.ProductID);
  }

  public addRow(gridID) {
      if (this.addProductId === 0) {
        this.addProductId = this._remoteService.dataLength.getValue();
      }

    this.grid.addRow({
        ProductID: this.addProductId++,
        CategoryID: this.getRandomInt(1, 10),
        ProductName: 'Product with index ' + this.addProductId,
        UnitPrice: this.getRandomInt(10, 1000),
        UnitsInStock: this.getRandomInt(10, 1000),
        QuantityPerUnit: (this.getRandomInt(1, 10) * 10).toString() + ' pcs.',
        ReorderLevel: this.getRandomInt(10, 20),
    });
}

  public undo() {
    this.grid.transactions.undo();
 }

  public redo() {
    this.grid.transactions.redo();
  }


  public commit() {
    const newRows = this.grid.transactions.getAggregatedChanges(true);
    this.grid.transactions.commit(this.grid.data);
    this._remoteService.addData(newRows.map(rec => rec.newValue));
  }

  public discard() {
    this.grid.transactions.clear();
  }

  public handleSelection(event: any) {
    const fields = event.newSelection.map(rec => rec.field);
    this.getDetailsData(this.product.Id, fields);
  }

  public getDetailsData(pid: number, fields?: string[], expandRel?: string) {
        if (this._ordersRequest$) {
         // this._ordersRequest$.unsubscribe();
        }
        const baseFields = ['OrderID', 'OrderDate', 'ShipCountry', 'Freight'];
        fields = fields ?  baseFields.concat(fields) : baseFields;
        expandRel = expandRel ? expandRel : 'Details';

        this._ordersRequest$ = this._remoteService.getTableData(ORDERS, fields, expandRel);
        this._ordersRequest$.subscribe({
            next: (respData: any) => {
                const dataForProduct = this.flattenResponseData(respData.value, pid, fields);
                this._ordersDetailsData.next(dataForProduct);
                this.showGridLoader = false;
                this.grid.reflow();
                this.grid.cdr.detectChanges();

                const orderDetailsForProduct = dataForProduct.map((rec => {
                  return { 'OrderDate': rec.OrderDate, 'Quantity': rec.quantity};
                }));
                this._ordersTimelineData.next(orderDetailsForProduct);
                this.showLoader = false;
            },
            // on remote data service error, let's bind local data
            error: err => this.flattenResponseData(ORDERS_DATA, pid, fields)
        });
  }

  public flattenResponseData(respData: any, pid: number, fields: string[]) {

    const dataForProduct = respData.filter((rec) =>
        rec.details[0].productid === pid
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

  public formatDateLabel(item: any): string {
    return new Date(Date.parse(item.OrderDate)).toLocaleDateString('US');
  }

  public formatNumber(value: number) {
      return value;
      // return value.toFixed(2);
  }

  public formatCurrency(value: number) {
      return value;
      // return '$' + value.toFixed(2);
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

  private getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}
