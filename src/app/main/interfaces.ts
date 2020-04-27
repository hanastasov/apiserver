export interface IProduct {
    ProductID: number;
    ProductName: string;
    SupplierID: number;
    CategoryID: number;
    QuantityPerUnit: string;
    UnitPrice: number;
    UnitsInStock: number;
    UnitsOnOrder: number;
    ReorderLevel: number;
    Discontinued: boolean;
    CategoryName: string;
}

export interface IOrderDetails extends IDetail {
    OrderDate: Date;
    Freight: number;
    OrderID: number;
    ShipCountry: string;
    Details?: IDetail;
}

export interface IDetail  {
    Discount: number;
    OrderID: number;
    ProductID: number;
    Quantity: number;
    UnitProce: number;
}
