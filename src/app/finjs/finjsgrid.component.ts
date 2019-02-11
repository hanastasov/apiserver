import { Component, OnInit, ViewChild, AfterViewInit, QueryList, NgZone, ElementRef, ChangeDetectorRef } from '@angular/core';
import { RemoteFilteringService } from '../services/remoteData.service';
import { IgxGridComponent, IgxGridCellComponent, IgxButtonGroupComponent,
    IgxSliderComponent, IgxColumnComponent, SortingDirection, DefaultSortingStrategy } from 'igniteui-angular';
import { Observable } from 'rxjs';

interface IButton {
    ripple ?: string;
    label ?: string;
    disabled ?: boolean;
    togglable ?: boolean;
    selected ?: boolean;
    color ?: string;
    icon ?: string;
}

class Button {
    private ripple: string;
    private label: string;
    private togglable: boolean;
    private selected: boolean;
    private color: string;
    private icon: string;

    constructor(obj ?: IButton) {
        this.label = obj.label;
        this.selected = obj.selected || false;
        this.togglable = obj.togglable;
        this.color = obj.color;
        this.icon = obj.icon;
    }
}

@Component({
  providers: [RemoteFilteringService],
  selector: 'app-grid',
  templateUrl: './finjsgrid.component.html',
  styleUrls: ['./finjsgrid.component.scss']
})
export class FinjsGridComponent implements OnInit, AfterViewInit {
    public remoteData: any;
    @ViewChild('grid1') public grid1: IgxGridComponent;
    @ViewChild('buttonGroup1') public buttonGroup1: IgxButtonGroupComponent;
    @ViewChild('slider1') public volumeSlider: IgxSliderComponent;
    @ViewChild('slider2') public intervalSlider: IgxSliderComponent;

    public theme = false;
    public volume = 1000;
    public frequency = 500;
    public controls = [
        new Button({
            disabled: false,
            icon: 'update',
            label: 'LIVE PRICES',
            selected: false
        }),
        new Button({
            disabled: false,
            icon: 'update',
            label: 'LIVE ALL PRICES',
            selected: false
        }),
        new Button({
            disabled: true,
            icon: 'stop',
            label: 'Stop',
            selected: false
        })
    ];

    private subscription;
    private selectedButton;
    private _timer;

    private _prevRequest: any;
    private _chunkSize: number;

    // tslint:disable-next-line:member-ordering
    constructor(private zone: NgZone, private _remoteService: RemoteFilteringService, public cdr: ChangeDetectorRef) {
    }
    // tslint:disable-next-line:member-ordering
    public ngOnInit() {
        this.remoteData = this._remoteService.remoteData;
        this.grid1.sortingExpressions = [{
                dir: SortingDirection.Asc,
                fieldName: 'Id',
                ignoreCase: false,
                strategy: DefaultSortingStrategy.instance()
            }
            // {
            //     dir: SortingDirection.Desc,
            //     fieldName: 'Type',
            //     ignoreCase: false,
            //     strategy: DefaultSortingStrategy.instance()
            // },
            // {
            //     dir: SortingDirection.Desc,
            //     fieldName: 'Contract',
            //     ignoreCase: false,
            //     strategy: DefaultSortingStrategy.instance()
            // }
        ];
    }

    public ngAfterViewInit() {
        const filteringExpr = this.grid1.filteringExpressionsTree.filteringOperands;
        const sortingExpr = this.grid1.sortingExpressions[0];
        this._chunkSize = Math.ceil(parseInt(this.grid1.height, 10) / this.grid1.rowHeight);
        this._remoteService.getFinancialData(
            {
                chunkSize: this._chunkSize,
                startIndex: this.grid1.virtualizationState.startIndex
            },
            filteringExpr,
            sortingExpr,
            (data) => {
                this.grid1.totalItemCount = data['@odata.count'];
            });
       // this.grid1.reflow();
    }

    public chartClick(cell: IgxGridCellComponent) {
        // TODO
        // cell.column.field returns the column
    }

    public onButtonAction(event: any) {
        switch (event.index) {
            case 0: {
                    this.disableOtherButtons(event.index, true);
                    const currData = this.grid1.data;
                    this._timer = setInterval(() => this.ticker(currData), this.frequency);
                    break;
                }
            case 1: {
                    this.disableOtherButtons(event.index, true);
                    const currData = this.grid1.data;
                    this._timer = setInterval(() => this.tickerAllPrices(currData), this.frequency);
                    break;
                }
                case 2: {
                    this.disableOtherButtons(event.index, false);
                    this.stopFeed();
                    break;
                }
            default:
                {
                    break;
                }
        }
    }

    public onChange(event: any) {
        if (this.grid1.groupingExpressions.length > 0) {
            this.grid1.groupingExpressions = [];
        } else {
            this.grid1.groupingExpressions = [{
                dir: SortingDirection.Desc,
                fieldName: 'Category',
                ignoreCase: false,
                strategy: DefaultSortingStrategy.instance()
            },
            {
                dir: SortingDirection.Desc,
                fieldName: 'Type',
                ignoreCase: false,
                strategy: DefaultSortingStrategy.instance()
            },
            {
                dir: SortingDirection.Desc,
                fieldName: 'Contract',
                ignoreCase: false,
                strategy: DefaultSortingStrategy.instance()
            }
        ];
        }
    }

    public stopFeed() {
        if (this._timer) {
            clearInterval(this._timer);
        }
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
    }

    public formatNumber(value: number) {
        return value;
    }

    public percentage(value: number) {
        return value;
    }

    public formatCurrency(value: number) {
        return '$' + value;
    }

    public onVolumeChanged(event: any) {
      //  this._remoteService.getData(this.volume);
    }

    // the below code is needed when accessing the sample through the navigation
    // it will style all the space below the sample component element, but not the navigation menu
    public onThemeChanged(event: any) {
        // const parentEl = this.parentComponentEl();
        // if (event.checked && parentEl.classList.contains('main')) {
        //     parentEl.classList.add('dark-theme');
        // } else {
        //     parentEl.classList.remove('dark-theme');
        // }
    }

    public toggleToolbar(event: any) {
        this.grid1.showToolbar = !this.grid1.showToolbar;
    }

    private negative = (rowData: any): boolean => {
        return rowData['Change(%)'] < 0;
    }
    private positive = (rowData: any): boolean => {
        return rowData['Change(%)'] > 0;
    }
    private changeNegative = (rowData: any): boolean => {
        return rowData['Change(%)'] < 0 && rowData['Change(%)'] > -1;
    }
    private changePositive = (rowData: any): boolean => {
        return rowData['Change(%)'] > 0 && rowData['Change(%)'] < 1;
    }
    private strongPositive = (rowData: any): boolean => {
        return rowData['Change(%)'] >= 1;
    }
    private strongNegative = (rowData: any, key: string): boolean => {
        return rowData['Change(%)'] <= -1;
    }

    // tslint:disable-next-line:member-ordering
    public trends = {
        changeNeg: this.changeNegative,
        changePos: this.changePositive,
        negative: this.negative,
        positive: this.positive,
        strongNegative: this.strongNegative,
        strongPositive: this.strongPositive
    };
    // tslint:disable-next-line:member-ordering
    public trendsChange = {
        changeNeg2: this.changeNegative,
        changePos2: this.changePositive,
        strongNegative2: this.strongNegative,
        strongPositive2: this.strongPositive
    };

    private disableOtherButtons(ind: number, disableButtons: boolean) {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
        this.volumeSlider.disabled = disableButtons;
        this.intervalSlider.disabled = disableButtons;
        this.selectedButton = ind;
        this.buttonGroup1.buttons.forEach((button, index) => {
            if (index === 2) { button.disabled = !disableButtons; } else {
                button.disabled = disableButtons;
            }
        });
    }

    get grouped(): boolean {
        return this.grid1.groupingExpressions.length > 0;
    }

    get buttonSelected(): number {
      return this.selectedButton || this.selectedButton === 0 ? this.selectedButton : -1;
    }

    public processData() {
        if (this._prevRequest) {
            this._prevRequest.unsubscribe();
        }

        // this.toast.message = 'Loading Remote Data...';
        // this.toast.position = 1;
        // this.toast.displayTime = 1000;
        // this.toast.show();
        this.cdr.detectChanges();

        const virtualizationState = this.grid1.virtualizationState;
        const filteringExpr = this.grid1.filteringExpressionsTree.filteringOperands;
        const sortingExpr = this.grid1.sortingExpressions[0];

        this._prevRequest = this._remoteService.getFinancialData(
            {
                chunkSize: this._chunkSize,
                startIndex: virtualizationState.startIndex
            },
            filteringExpr,
            sortingExpr,
            (data) => {
                this.grid1.totalItemCount = data['@odata.count'];
               // this.toast.hide();
                this.cdr.detectChanges();
            });
    }

    // tslint:disable-next-line:member-ordering
    public ticker(data: any) {
        this.zone.runOutsideAngular(() => {
            this.grid1.data = this.updateRandomPrices(data);
            this.zone.run(() => this.grid1.markForCheck());
        });
    }

    // tslint:disable-next-line:member-ordering
    public tickerAllPrices(data: any) {
        this.zone.runOutsideAngular(() => {
            this.grid1.data = this.updateAllPrices(data);
            this.zone.run(() => this.grid1.markForCheck());
        });
    }

    // tslint:disable-next-line:member-ordering
    public updateAllPrices(data: any[]): any {
        const currData = [];
        for (const dataRow of data) {
          this.randomizeObjectData(dataRow);
        }
        return data;
      }

    // tslint:disable-next-line:member-ordering
    public updateRandomPrices(data: any[]): any {
        let y = 0;
        for (let i = Math.round(Math.random() * 10); i < data.length; i += Math.round(Math.random() * 10)) {
          this.randomizeObjectData(data[i]);
          y++;
        }
       // return {data: currData, recordsUpdated: y };
        return data;
      }

    private randomizeObjectData(dataObj) {
        const changeP = 'Change(%)';
        const res = this.generateNewPrice(dataObj.Price);
        dataObj.Change = res.Price - dataObj.Price;
        dataObj.Price = res.Price;
        dataObj[changeP] = res.ChangePercent;
    }
    private generateNewPrice(oldPrice): any {
        const rnd = parseFloat(Math.random().toFixed(2));
        const volatility = 2;
        let newPrice = 0;

        let changePercent = 2 * volatility * rnd;
        if (changePercent > volatility) {
            changePercent -= (2 * volatility);
        }

        const changeAmount = oldPrice * (changePercent / 100);
        newPrice = oldPrice + changeAmount;

        const result = {Price: 0, ChangePercent: 0};
        result.Price = parseFloat(newPrice.toFixed(2));
        result.ChangePercent = parseFloat(changePercent.toFixed(2));

        return result;
    }
}
