import { ChangeDetectorRef, Component, TemplateRef, ViewChild, AfterViewInit, OnInit, OnDestroy } from '@angular/core';
import { IgxColumnComponent,
    IgxGridComponent,
    IgxDropDownComponent,
    IgxInputDirective,
    IgxInputGroupComponent,
    ISelectionEventArgs } from 'igniteui-angular';
import { RemoteServiceVirt } from '../services/remoteService';

@Component({
    providers: [RemoteServiceVirt],
    selector: 'app-grid-remote-virtualization-sample',
    styleUrls: ['grid-sample-4.component.scss'],
    templateUrl: 'grid-sample-4.component.html'
})

export class GridRemoteVirtualizationSampleComponent implements OnInit, AfterViewInit, OnDestroy {
    public remoteData: any;
    public remoteMetadata: any;
    public tables: any[] = [];
    public selectedTable = '';

    @ViewChild('grid') public grid: IgxGridComponent;
    @ViewChild('remoteDataLoadingLarge', { read: TemplateRef })
    protected remoteDataLoadingLargeTemplate: TemplateRef<any>;
    @ViewChild('remoteDataLoadingMedium', { read: TemplateRef })
    protected remoteDataLoadingMediumTemplate: TemplateRef<any>;
    @ViewChild('remoteDataLoadingSmall', { read: TemplateRef })
    protected remoteDataLoadingSmallTemplate: TemplateRef<any>;

    @ViewChild(IgxDropDownComponent) public igxDropDown: IgxDropDownComponent;
    @ViewChild('inputGroup', { read: IgxInputGroupComponent}) public inputGroup: IgxInputGroupComponent;
    @ViewChild('input', { read: IgxInputDirective })
    public input: IgxInputDirective;

    private _columnCellCustomTemplates: Map<IgxColumnComponent, TemplateRef<any>>;
    private _isColumnCellTemplateReset = false;
    private _prevRequest: any;

    constructor(private _remoteService: RemoteServiceVirt, public cdr: ChangeDetectorRef) { }

    public ngOnInit(): void {
        this.remoteData = this._remoteService.data;
        this._columnCellCustomTemplates = new Map<IgxColumnComponent, TemplateRef<any>>();
        this._remoteService.getTables((tables) => {
            tables.forEach(table => {
                this.tables.push({field: table.name});
            });
        });
    }

    public ngAfterViewInit() {
        if (this.selectedTable) {
            this.updateGrid();
        }
    }

    public processData(reset) {
        if (this._prevRequest) {
            this._prevRequest.unsubscribe();
        }

        if (this.grid.columns.length > 0) {
            this.grid.columns.forEach((column: IgxColumnComponent) => {
                if (column.bodyTemplate && !this._isColumnCellTemplateReset) {
                    this._columnCellCustomTemplates.set(column, column.bodyTemplate);
                }

                column.bodyTemplate = this.getDataLoadingTemplate();
            });

            this._isColumnCellTemplateReset = true;
        }

        this._prevRequest = this._remoteService.getData(this.selectedTable, this.grid.virtualizationState,
            this.grid.sortingExpressions[0], reset, () => {
                if (this._isColumnCellTemplateReset) {
                    let oldTemplate;
                    this.grid.columns.forEach((column: IgxColumnComponent) => {
                        oldTemplate = this._columnCellCustomTemplates.get(column);
                        column.bodyTemplate = oldTemplate;
                    });
                    this._columnCellCustomTemplates.clear();
                    this._isColumnCellTemplateReset = false;
                }

                this.cdr.detectChanges();
            });
    }

    public onSelection(eventArgs: ISelectionEventArgs) {
        this.selectedTable = eventArgs.newSelection.value;
        this.updateGrid();
    }

    public formatNumber(value: number) {
        return value.toFixed(2);
    }

    public formatCurrency(value: number) {
        return '$' + value.toFixed(2);
    }

    public ngOnDestroy() {
        if (this._prevRequest) {
            this._prevRequest.unsubscribe();
        }
    }

    private getDataLoadingTemplate(): TemplateRef<any> {
        const val = Math.floor(Math.random() * 3) + 1;

        switch (val) {
            case 1: return this.remoteDataLoadingLargeTemplate;
            case 2: return this.remoteDataLoadingMediumTemplate;
            case 3: return this.remoteDataLoadingSmallTemplate;
        }
    }

    private updateGrid() {
        this._remoteService.getMetadata(this.selectedTable, (metadata) => {
            const names = metadata.items[0]['odata:cname'];
            const types = metadata.items[0]['odata:cdatatype'];
            const columns = [];

            for (let i = 0; i < names.length; i++) {
                columns.push({ field: names[i], width: '200px', type: (types[i] === 'string' ? 'string' : 'number') });
            }
            this.remoteMetadata = columns;
        });
        this._remoteService.getData(this.selectedTable, this.grid.virtualizationState, this.grid.sortingExpressions[0], true, (data) => {
            this.grid.totalItemCount = data['@odata.count'];
        });
    }
}
