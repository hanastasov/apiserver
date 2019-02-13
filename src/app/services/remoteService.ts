import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { IForOfState, SortingDirection } from 'igniteui-angular';
import { BehaviorSubject, Observable } from 'rxjs';

// base URL for the API
const BASE_URL = 'http://localhost:8153/api.rsc';

// sample table metadata (columns) endpoint
// const METADATA_URL: string = "http://localhost:8153/api.rsc/albums/$metadata"

// sample table data endpoint
// const DATA_URL: string = "http://localhost:8153/api.rsc/albums/";

const authtoken = '2q3P0o4p9N9a7e2B9f8q';
const HTTP_OPTIONS = {
    headers: new HttpHeaders({
        'x-cdata-authtoken': authtoken
    })
};
const EMPTY_STRING = '';
export enum SortOrder {
    ASC = 'asc',
    DESC = 'desc',
    NONE = ''
}

@Injectable()
export class RemoteServiceVirt {
    public data: Observable<any[]>;
    public metadata: Observable<any[]>;
    private _data: BehaviorSubject<any[]>;
    private _cachedData: any[];

    constructor(private _http: HttpClient) {
        this._data = new BehaviorSubject([]);
        this.data = this._data.asObservable();
    }

    public getData(table: string, virtualizationArgs?: IForOfState, sortingArgs?: any, resetData?: boolean, cb?: (any) => void): any {
        const startIndex = virtualizationArgs.startIndex;
        const endIndex = virtualizationArgs.chunkSize + startIndex;
        let areAllItemsInCache = true;

        if (resetData) {
            this._http.get(this._buildDataUrl(table, virtualizationArgs, sortingArgs), HTTP_OPTIONS).subscribe((data: any) => {
                this._cachedData = new Array<any>(data['@odata.count']).fill(null);
                this._updateData(data, startIndex);
                if (cb) {
                    cb(data);
                }
            });

            return;
        }

        for (let i = startIndex; i < endIndex; i++) {
            if (this._cachedData[i] === null) {
                areAllItemsInCache = false;
                break;
            }
        }

        if (!areAllItemsInCache) {
            this._http.get(this._buildDataUrl(table, virtualizationArgs, sortingArgs), HTTP_OPTIONS).subscribe((data: any) => {
                this._updateData(data, startIndex);
                if (cb) {
                    cb(data);
                }
            });
        } else {
            const data = this._cachedData.slice(startIndex, endIndex);
            this._data.next(data);
            if (cb) {
                cb(data);
            }
        }
    }

    public getMetadata(table: string, cb?: (any) => void): any {
        const areAllItemsInCache = true;
        this._http.get(this._buildMetadataUrl(table), HTTP_OPTIONS).subscribe((metadata: any) => {
            if (cb) {
                cb(metadata);
            }
        });
    }

    public getTables(cb?: (any) => void): any {
        this._http.get(this._buildTablesUrl(), HTTP_OPTIONS).subscribe((tables: any) => {
            if (cb) {
                cb(tables.value);
            }
        });
    }

    private _updateData(data: any, startIndex: number) {
        this._data.next(data.value);
        for (let i = 0; i < data.value.length; i++) {
            this._cachedData[i + startIndex] = data.value[i];
        }
    }

    private _buildDataUrl(table: string, virtualizationArgs: any, sortingArgs: any): string {
        let baseQueryString = `${BASE_URL}/${table}?$count=true`;
        let scrollingQuery = EMPTY_STRING;
        let orderQuery = EMPTY_STRING;
        let query = EMPTY_STRING;

        if (sortingArgs) {
            let sortingDirection: string;
            switch (sortingArgs.dir) {
                case SortingDirection.Asc:
                    sortingDirection = SortOrder.ASC;
                    break;
                case SortingDirection.Desc:
                    sortingDirection = SortOrder.DESC;
                    break;
                default:
                    sortingDirection = SortOrder.NONE;
            }

            orderQuery = `$orderby=${sortingArgs.fieldName} ${sortingDirection}`;
        }

        if (virtualizationArgs) {
            let requiredChunkSize: number;
            const skip = virtualizationArgs.startIndex;
            requiredChunkSize = virtualizationArgs.chunkSize === 0 ? 11 : virtualizationArgs.chunkSize;
            const top = requiredChunkSize;
            scrollingQuery = `$skip=${skip}&$top=${top}`;
        }

        query += (orderQuery !== EMPTY_STRING) ? `&${orderQuery}` : EMPTY_STRING;
        query += (scrollingQuery !== EMPTY_STRING) ? `&${scrollingQuery}` : EMPTY_STRING;

        baseQueryString += query;

        return baseQueryString;
    }

    private _buildMetadataUrl(table: string): string {
        const baseQueryString = `${BASE_URL}/${table}/$metadata?@json`;

        return baseQueryString;
    }

    private _buildTablesUrl(): string {
        const baseQueryString = `${BASE_URL}`;

        return baseQueryString;
    }
}
