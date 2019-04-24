import { Component, OnInit, ViewChild, ChangeDetectorRef, AfterViewInit, OnDestroy } from '@angular/core';
import { RemoteDataService } from '../services/remoteData.service';
import { IgxGridComponent, IgxToastComponent, IgxTransactionService, IgxGridTransaction, IgxDatePickerComponent } from 'igniteui-angular';
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
  providers: [RemoteDataService, { provide: IgxGridTransaction, useClass: IgxTransactionService }],
  selector: 'app-grid',
  templateUrl: './grid.component.html',
  styleUrls: ['./grid.component.scss']
})

export class GridComponent implements OnInit, AfterViewInit, OnDestroy {
  public productsData: any;
  public chartType = 'Line';
  public showLoader = false;
  public showGridLoader = false;
  public product: Product = {Name: '' };

  private _ordersDetailsData = new BehaviorSubject([]);
  private _ordersTimelineData = new BehaviorSubject([]);
  private _detailsFields = new BehaviorSubject([]);

  public ordersDetailsData = this._ordersDetailsData.asObservable();
  public ordersTimelineData = this._ordersTimelineData.asObservable();
  public detailsFields = this._detailsFields.asObservable();
  public allDetailsFields: any;

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

  // private addProductId = 0;
  private pid: number;
  private fields: string[];

  @ViewChild('grid') public grid: IgxGridComponent;
  @ViewChild('grid2') public grid2: IgxGridComponent;
  @ViewChild('toast') public toast: IgxToastComponent;
  @ViewChild('startDate') public startDate: IgxDatePickerComponent;
  @ViewChild('endDate') public endDate: IgxDatePickerComponent;

  constructor(private _remoteService: RemoteDataService, public cdr: ChangeDetectorRef) { }

  public ngOnInit(): void {
      // getting the metadata (field names) for the ORDERS table
      this._detailsFieldsRequest$ = this._remoteService.getMetadata(ORDERS, (data) => {
        this.allDetailsFields = data;
      });
  }

  public ngAfterViewInit() {
    const virtArgs = null;
    const filtArgs = null;
    const sortArgs = null;
    // _prodsRequest$ fetches data for the products grid from the PRODUCTS table
    this._prodsRequest$ = this._remoteService.getData(PRODUCTS, virtArgs, filtArgs, sortArgs, (data) => {
      this.grid.data = data.value;
      this.grid.height = '80%';
    });
  }

  public cellSelection(evt) {
    // when a row is selected, implement logic to fetch details data for the selected record
    if (this._detailsFieldsRequest$) {
      this._detailsFieldsRequest$.unsubscribe();
    }
    const cell = evt.cell;
    this.product = {Id: cell.row.rowID.ProductID, Name: cell.row.rowID.ProductName };
    this.showLoader = true;
    this.showGridLoader = true;
    this.grid.selectRows([cell.row.rowID], true);
    this.pid = cell.row.rowID.ProductID;
    // call getDetailsData to fetch details data for product with id of this.pid
    this.getDetailsData(this.pid);
  }

  public comboItemSelected(event: any) {
    const fields = this.fields = event.newSelection.map(rec => rec.field);
    // when a new field in the combo is selected, fetch the data so taht it gets displayed in the grid
    this.getDetailsData(this.product.Id, fields);
  }

  public getDetailsData(pid: number, fields?: string[], expandRel?: string) {
        if (this._ordersRequest$) {
          // uncommenting the below line triggers a bug
          // this._ordersRequest$.unsubscribe();
        }

        // initially those are the fields displayed in the details data grid
        // if request comes from the comboItemSelected, then fields are added to the initial collection
        const baseFields = ['OrderID', 'OrderDate', 'ShipCountry', 'Freight'];
        fields = this.fields = fields ?  baseFields.concat(fields) : baseFields;
        expandRel = expandRel ? expandRel : 'Details';

        // this will populate the combo for the details data grid
        this._detailsFields.next(this.allDetailsFields.filter(value => fields.includes(value.field)));

        // _ordersRequest$ is fetching data for the details grid, the timeline chart and the pie chart from the ORDERS table
        this._ordersRequest$ = this._remoteService.getTableData(ORDERS, fields, expandRel);
        this._ordersRequest$.subscribe({
            next: (respData: any) => {
               // why not FILter the request ??
                const dataForProduct = this.flattenResponseData(respData.value, pid, fields);
                // _ordersDetaislData will populate the details data grid
                this._ordersDetailsData.next(dataForProduct);
                this.showGridLoader = false;
                this.grid.reflow();
                this.grid.cdr.detectChanges();

                // for the timeline chart, we need only OrderDate and Quantity fields
                const orderDetailsForProduct = dataForProduct.map((rec => {
                  return { 'OrderDate': rec.OrderDate, 'Quantity': rec.quantity};
                }));
                this._ordersTimelineData.next(orderDetailsForProduct);
                this.showLoader = false;

                // use the earliest and latest dates from the data to populate the #startDate and #endDate date pickers
                this.setDates(dataForProduct[0]['OrderDate'], dataForProduct[dataForProduct.length - 1]['OrderDate']);
            },
            // on remote data service error, let's bind local data
            error: err => this.flattenResponseData(ORDERS_DATA, pid, fields)
        });
  }

  public flattenResponseData(respData: any, pid: number, fields: string[]) {
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

  public setDates(startDate, endDate) {
    this.cdr.detectChanges();
    this.startDate.writeValue(new Date(startDate));
    this.endDate.writeValue(new Date(endDate));
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

  public onStartDateSelected(event: any) {
    // if (this._ordersRequest$) {
    //    this._ordersRequest$.unsubscribe();
    //  }

    //  this._ordersRequest$ = this._remoteService.getTableData(ORDERS, this.fields, 'Details', 'hey');
    //   this._ordersRequest$.subscribe({
    //     next: (respData: any) => {
    //         const dataForProduct = this.flattenResponseData(respData.value, this.pid, this.fields);
    //         this._ordersDetailsData.next(dataForProduct);
    //         this.showGridLoader = false;
    //         this.grid.reflow();
    //         this.grid.cdr.detectChanges();

    //         const orderDetailsForProduct = dataForProduct.map((rec => {
    //           return { 'OrderDate': rec.OrderDate, 'Quantity': rec.quantity};
    //         }));
    //         this._ordersTimelineData.next(orderDetailsForProduct);
    //         this.showLoader = false;
    //         this.setDates(dataForProduct[0]['OrderDate'], dataForProduct[dataForProduct.length - 1]['OrderDate']);
    //     },
    //     // on remote data service error, let's bind local data
    //     error: err => this.flattenResponseData(ORDERS_DATA, this.pid, this.fields)
    // });
  }

  public onEndDateSelected(event: any ) {
    alert('A date has been selected!');
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

  // private getRandomInt(min, max) {
  //   return Math.floor(Math.random() * (max - min + 1)) + min;
  // }

//   public addRow(gridID) {
//       if (this.addProductId === 0) {
//         this.addProductId = this._remoteService.dataLength.getValue();
//       }

//     this.grid.addRow({
//         ProductID: this.addProductId++,
//         CategoryID: this.getRandomInt(1, 10),
//         ProductName: 'Product with index ' + this.addProductId,
//         UnitPrice: this.getRandomInt(10, 1000),
//         UnitsInStock: this.getRandomInt(10, 1000),
//         QuantityPerUnit: (this.getRandomInt(1, 10) * 10).toString() + ' pcs.',
//         ReorderLevel: this.getRandomInt(10, 20),
//     });
// }

//   public undo() {
//     this.grid.transactions.undo();
//  }

//   public redo() {
//     this.grid.transactions.redo();
//   }


  // public commit() {
  //   const newRows = this.grid.transactions.getAggregatedChanges(true);
  //   this.grid.transactions.commit(this.grid.data);
  //   this._remoteService.addData(newRows.map(rec => rec.newValue));
  // }

  // public discard() {
  //   this.grid.transactions.clear();
  // }
}
