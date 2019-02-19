import { Component, OnInit, ViewChild, ChangeDetectorRef, AfterViewInit, OnDestroy } from '@angular/core';
import { RemoteFilteringService } from '../services/remoteData.service';
import { IgxGridComponent, IgxToastComponent } from 'igniteui-angular';
import { BehaviorSubject, Observable } from 'rxjs';
import { ORDERS_DATA } from 'src/localData/northwind';

const TABLE_PREFIX = 'northwind_dbo_';
const MONGO_TABLE_PREFIC = 'CData_Northwind_';
const PRODUCTS = `${TABLE_PREFIX}Products`;
const ORDERS = `${TABLE_PREFIX}Orders`;
const ORDER_DETAILS = `${TABLE_PREFIX}Order+Details`;

@Component({
  providers: [RemoteFilteringService],
  selector: 'app-grid',
  templateUrl: './grid.component.html',
  styleUrls: ['./grid.component.scss']
})
export class GridComponent implements OnInit, AfterViewInit, OnDestroy {
  public remoteData: any;
  public chartType = 'Line';
  public showLoader = false;
  public showGridLoader = false;

  private _ordersData = new BehaviorSubject([]);
  private _ordersDetailsData = new BehaviorSubject([]);
  private _ordersTimelineData = new BehaviorSubject([]);

  public ordersData = this._ordersData.asObservable();
  public ordersDetailsData = this._ordersDetailsData.asObservable();
  public ordersTimelineData = this._ordersTimelineData.asObservable();

  private _prodsRequest: any;
  private _ordersRequest$: any;

  @ViewChild('grid') public grid: IgxGridComponent;
  @ViewChild('toast') public toast: IgxToastComponent;

  constructor(private _remoteService: RemoteFilteringService, public cdr: ChangeDetectorRef) { }

  public ngOnInit(): void {
      this.remoteData = this._remoteService.remoteData;
  }

  public ngAfterViewInit() {
      this._prodsRequest = this._remoteService.getData(PRODUCTS);
  }

  public onSelectionChange(args) {

    if (args.newSelection.length > 0) {
        this.showLoader = true;
        this.showGridLoader = true;
        this.getDetailsData(args.newSelection[0].ProductID);

    } else {
        this.showLoader = false;
        this.showGridLoader = false;
    }
  }

    public getDetailsData(pid: number) {
        if (this._ordersRequest$) {
            this._ordersRequest$.unsubscribe();
        }
        const fields = ['OrderID', 'OrderDate', 'ShipCountry', 'Freight'];
        const expandRel = 'Details';

        this._ordersRequest$ = this._remoteService.getTableData(ORDERS, null, expandRel);
        this._ordersRequest$.subscribe({
            next: (respData: any) => {
                this.flattenData(respData.value, pid);
            },
            // on remote data serice error, let's bind local data
            error: err => this.flattenData(ORDERS_DATA, pid)
        });
    }

  public flattenData(respData: any, pid: number) {

    const dataForProduct = respData.filter((rec) =>
        rec.details[0].productid === pid
    ).map(((rec, index) => {
        return { 'OrderDate': rec.OrderDate, 'ShipCountry': rec.ShipCountry, 'Freight': rec.Freight,
        ...respData[index].details[0]};
    }));

    this._ordersDetailsData.next(dataForProduct);
    this.showGridLoader = false;

    const orderDetailsForProduct = dataForProduct.map((rec => {
        return { 'OrderDate': rec.OrderDate, 'Quantity': rec.quantity};
    }));
    this._ordersTimelineData.next(orderDetailsForProduct);
    this.showLoader = false;

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
    if (this._prodsRequest) {
        this._prodsRequest.unsubscribe();
    }
    if (this._ordersRequest$) {
        this._ordersRequest$.unsubscribe();
    }
  }
}
