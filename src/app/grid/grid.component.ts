import { Component, OnInit, ViewChild, ChangeDetectorRef, AfterViewInit, OnDestroy } from '@angular/core';
import { RemoteFilteringService } from '../services/remoteData.service';
import { IgxGridComponent, IgxToastComponent } from 'igniteui-angular';
import { BehaviorSubject, Observable } from 'rxjs';

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
  public data: any;
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
  private _ordersDetailsRequest$: any;

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
    if (this._ordersDetailsRequest$) {
        this._ordersDetailsRequest$.unsubscribe();
    }

    if (this._ordersRequest$) {
        this._ordersRequest$.unsubscribe();
    }

    if (args.newSelection.length > 0) {
        this.showLoader = true;
        this.showGridLoader = true;
        let dataForProduct: any;
        let ordersNumbers: any;
        let orderDetailsForProduct: any;
        const fields = ['OrderID', 'OrderDate', 'ShipCountry', 'Freight'];

        this._ordersDetailsRequest$ = this._remoteService.getTableData(ORDER_DETAILS);
        this._ordersRequest$ = this._remoteService.getTableData(ORDERS, fields);

        this._ordersDetailsRequest$.subscribe((data: any) => {
                dataForProduct = data.value.filter((rec) =>
                    rec.ProductID === args.newSelection[0].ProductID
                );
                this._ordersDetailsData.next(dataForProduct);
                this.showGridLoader = false;
                ordersNumbers = dataForProduct.map(el => el.OrderID);

                this._ordersRequest$.subscribe((respData: any) => {
                    orderDetailsForProduct = respData.value.filter((rec) =>
                        ordersNumbers.indexOf(rec.OrderID) !== -1
                    );
                    this._ordersTimelineData.next(orderDetailsForProduct.map((rec, index) => {
                        return { 'OrderDate': rec.OrderDate, ...dataForProduct[index]};
                    }).map(rec => {
                        return { 'OrderDate': rec.OrderDate, 'Quantity': rec.Quantity};
                    }));
                    this._ordersData.next(orderDetailsForProduct);
                    this.showLoader = false;
                });
            });
    } else {
        this.showLoader = false;
        this.showGridLoader = false;
    }

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
    if (this._ordersDetailsRequest$) {
        this._ordersDetailsRequest$.unsubscribe();
    }
    if (this._ordersRequest$) {
        this._ordersRequest$.unsubscribe();
    }
  }
}
