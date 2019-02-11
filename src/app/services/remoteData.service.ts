import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { FilteringLogic, IForOfState, SortingDirection } from 'igniteui-angular';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

const BASE_URL = 'http://localhost:8153/api.rsc';
const DATA_URL = 'http://localhost:8153/api.rsc/NORTHWND_dbo_Products/';
const FINDATA_URL = 'http://localhost:8153/api.rsc/Finstock_dbo_Exchange/';
const EMPTY_STRING = '';
const NULL_VALUE = null;
const HTTPOPTIONS = {headers : new HttpHeaders({ 'x-cdata-authtoken': '2q3P0o4p9N9a7e2B9f8q' })};
export enum FILTER_OPERATION {
    CONTAINS = 'contains',
    STARTS_WITH = 'startswith',
    ENDS_WITH = 'endswith',
    EQUALS = 'eq',
    DOES_NOT_EQUAL = 'ne',
    DOES_NOT_CONTAIN = 'not contains',
    GREATER_THAN = 'gt',
    LESS_THAN = 'lt',
    LESS_THAN_EQUAL = 'le',
    GREATER_THAN_EQUAL = 'ge'
}

@Injectable()
export class RemoteFilteringService {
    public remoteData: Observable<any[]>;
    private _remoteData: BehaviorSubject<any[]>;

    constructor(private _http: HttpClient) {
        this._remoteData = new BehaviorSubject([]);
        this.remoteData = this._remoteData.asObservable();
    }

    public getData(
        virtualizationArgs?: IForOfState,
        filteringArgs?: any,
        sortingArgs?: any, cb?: (any) => void): any {
        return this._http.get(this.buildDataUrl(
            DATA_URL, virtualizationArgs, filteringArgs, sortingArgs), HTTPOPTIONS)
            .pipe(
                catchError(this.handleError)
            )
            .subscribe((data: any) => {
                this._remoteData.next(data.value);
                if (cb) {
                    cb(data);
                }
            });
    }

    public getFinancialData(
        virtualizationArgs?: IForOfState,
        filteringArgs?: any,
        sortingArgs?: any, cb?: (any) => void): any {

        return this._http.get(this.buildDataUrl(
            FINDATA_URL, virtualizationArgs, filteringArgs, sortingArgs), HTTPOPTIONS)
            .pipe(
                catchError(this.handleError)
            )
            .subscribe((data: any) => {
                this._remoteData.next(data.value);
                if (cb) {
                    cb(data);
                }
            });
    }

    private handleError(error: HttpErrorResponse) {
        console.log(error);
        return throwError(
            'Something bad happened; please try again later. ' + error);
    }

    private buildDataUrl(url: string, virtualizationArgs: any, filteringArgs: any, sortingArgs: any): string {
        let baseQueryString = `${url}?$count=true`;
        let scrollingQuery = EMPTY_STRING;
        let orderQuery = EMPTY_STRING;
        let filterQuery = EMPTY_STRING;
        let query = EMPTY_STRING;
        let filter = EMPTY_STRING;

        if (sortingArgs) {
            orderQuery = this._buildSortExpression(sortingArgs);
        }

        if (filteringArgs && filteringArgs.length > 0) {
            filteringArgs.forEach((columnFilter) => {
                if (filter !== EMPTY_STRING) {
                    filter += ` ${FilteringLogic[FilteringLogic.And].toLowerCase()} `;
                }

                filter += this._buildAdvancedFilterExpression(
                    columnFilter.filteringOperands,
                    columnFilter.operator);
            });

            filterQuery = `$filter=${filter}`;
        }

        if (virtualizationArgs) {
            scrollingQuery = this._buildScrollExpression(virtualizationArgs);
        }

        query += (orderQuery !== EMPTY_STRING) ? `&${orderQuery}` : EMPTY_STRING;
        query += (filterQuery !== EMPTY_STRING) ? `&${filterQuery}` : EMPTY_STRING;
        query += (scrollingQuery !== EMPTY_STRING) ? `&${scrollingQuery}` : EMPTY_STRING;

        baseQueryString += query;

        return baseQueryString;
    }

    private _buildAdvancedFilterExpression(operands, operator): string {
        let filterExpression = EMPTY_STRING;
        operands.forEach((operand) => {
            const value = operand.searchVal;
            const isNumberValue = (typeof (value) === 'number') ? true : false;
            const filterValue = (isNumberValue) ? value : `'${value}'`;
            const fieldName = operand.fieldName;
            let filterString;

            if (filterExpression !== EMPTY_STRING) {
                filterExpression += ` ${FilteringLogic[operator].toLowerCase()} `;
            }

            switch (operand.condition.name) {
                case 'contains': {
                    filterString = `${FILTER_OPERATION.CONTAINS}(${fieldName}, ${filterValue})`;
                    break;
                }
                case 'startsWith': {
                    filterString = `${FILTER_OPERATION.STARTS_WITH}(${fieldName},${filterValue})`;
                    break;
                }
                case 'endsWith': {
                    filterString = `${FILTER_OPERATION.ENDS_WITH}(${fieldName},${filterValue})`;
                    break;
                }
                case 'equals': {
                    filterString = `${fieldName} ${FILTER_OPERATION.EQUALS} ${filterValue} `;
                    break;
                }
                case 'doesNotEqual': {
                    filterString = `${fieldName} ${FILTER_OPERATION.DOES_NOT_EQUAL} ${filterValue} `;
                    break;
                }
                case 'doesNotContain': {
                    filterString = `${FILTER_OPERATION.DOES_NOT_CONTAIN}(${fieldName},${filterValue})`;
                    break;
                }
                case 'greaterThan': {
                    filterString = `${fieldName} ${FILTER_OPERATION.GREATER_THAN} ${filterValue} `;
                    break;
                }
                case 'greaterThanOrEqualTo': {
                    filterString = `${fieldName} ${FILTER_OPERATION.GREATER_THAN_EQUAL} ${filterValue} `;
                    break;
                }
                case 'lessThan': {
                    filterString = `${fieldName} ${FILTER_OPERATION.LESS_THAN} ${filterValue} `;
                    break;
                }
                case 'lessThanOrEqualTo': {
                    filterString = `${fieldName} ${FILTER_OPERATION.LESS_THAN_EQUAL} ${filterValue} `;
                    break;
                }
                case 'empty': {
                    filterString = `length(${fieldName}) ${FILTER_OPERATION.EQUALS} 0`;
                    break;
                }
                case 'notEmpty': {
                    filterString = `length(${fieldName}) ${FILTER_OPERATION.GREATER_THAN} 0`;
                    break;
                }
                case 'null': {
                    filterString = `${fieldName} ${FILTER_OPERATION.EQUALS} ${NULL_VALUE}`;
                    break;
                }
                case 'notNull': {
                    filterString = `${fieldName} ${FILTER_OPERATION.DOES_NOT_EQUAL} ${NULL_VALUE}`;
                    break;
                }
            }

            filterExpression += filterString;
        });

        return filterExpression;
    }

    private _buildSortExpression(sortingArgs): string {
        let sortingDirection: string;
        switch (sortingArgs.dir) {
            case SortingDirection.None: {
                sortingDirection = EMPTY_STRING;
                break;
            }
            default: {
                sortingDirection = SortingDirection[sortingArgs.dir].toLowerCase();
                break;
            }
        }

        return `$orderby=${sortingArgs.fieldName} ${sortingDirection}`;
    }

    private _buildScrollExpression(virtualizationArgs): string {
        let requiredChunkSize: number;
        const skip = virtualizationArgs.startIndex;
        requiredChunkSize = virtualizationArgs.chunkSize === 0 ? 11 : virtualizationArgs.chunkSize;
        const top = requiredChunkSize;

        return `$skip=${skip}&$top=${top}`;
    }

    private _buildMetadataUrl(table: string): string {
        const baseQueryString = `${BASE_URL}/${table}/$metadata?@json`;

        return baseQueryString;
    }

    private _buildTablesUrl(): string {
        let baseQueryString = `${BASE_URL}`;

        return baseQueryString;
    }
}