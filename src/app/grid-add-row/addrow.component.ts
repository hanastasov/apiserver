import { Component, OnInit, ViewChild, OnDestroy, ElementRef, Inject, Input } from '@angular/core';
import { PositionSettings, OverlaySettings, IgxOverlayService,
    HorizontalAlignment, VerticalAlignment, ConnectedPositioningStrategy, IgxGridComponent } from 'igniteui-angular';
import { Subject} from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { RemoteDataService } from '../services/remoteData.service';
import { Product } from './product';


@Component({
    providers: [RemoteDataService],
    selector: 'app-add-row',
    templateUrl: './addrow.component.html',
    styleUrls: ['./addrow.component.scss']
})

export class AddRowComponent implements OnInit, OnDestroy {
    public hideOverlay = true;
    public product;
    public pid: number;

    @Input()
    public target: IgxGridComponent;

    @ViewChild('addRow', { read: ElementRef, static: false }) public addNewRow: ElementRef;
    public showRow = false;
    private destroy$ = new Subject<boolean>();
    private _overlayId: string;
    private positionSettings: PositionSettings;
    private overlaySettings: OverlaySettings;

    constructor(private _remoteService: RemoteDataService, @Inject(IgxOverlayService) public overlayService: IgxOverlayService) { }

    public ngOnInit(): void {
        this.product = new Product();
        this.overlayService
            .onClosed
            .pipe(
                filter((x) => x.id === this._overlayId),
                takeUntil(this.destroy$))
            .subscribe(() => delete this._overlayId);
    }

    public showOverlay(edit: string, id: number) {
        // this.showRow = true;
        this.positionSettings = {
            target: this.target.theadRow.nativeElement,
            horizontalDirection: HorizontalAlignment.Right,
            verticalDirection: VerticalAlignment.Bottom,
            horizontalStartPoint: HorizontalAlignment.Left,
            verticalStartPoint: VerticalAlignment.Bottom
        };
        this.overlaySettings = {
            positionStrategy: new ConnectedPositioningStrategy(this.positionSettings),
            modal: false,
            closeOnOutsideClick: true
        };
        if (!this._overlayId) {
            this._overlayId = this.overlayService.attach(this.addNewRow, this.overlaySettings);
        }
        this.overlayService.show(this._overlayId, this.overlaySettings);
        this.hideOverlay = false;
    }

    public cancel() {
        this.hideOverlay = true;
        this.overlayService.hide(this._overlayId);
    }

    public addNewRowInGrid() {
        this.overlayService.hide(this._overlayId);
        this.target.isLoading = true;

        // POST
        const newPid = this.target.data.length + 1;
        const newRecord = this.product;
        newRecord.ProductID = newPid;

        this._remoteService.addData('Products', newRecord).subscribe({
            next: (metadata: any) => {
                this.hideOverlay = true;
                this.target.addRow(newRecord);
                this.target.isLoading = false;
            },
            error: err => {

            }
        });

    }

    public ngOnDestroy() {
        this.destroy$.next(true);
        this.destroy$.complete();
    }
}
