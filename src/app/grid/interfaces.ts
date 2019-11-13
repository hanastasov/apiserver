export interface Product {
    Id: number;
    Name: string;
}

export interface NorthwindProduct {
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

export interface NorthwindOrderDetail {
    OrderDate: Date;
    Freight: number;
    OrderID: number;
    ShipCountry: string;
    details?: OrderDetail[];
    discount?: number;
    orderid?: number;
    productid?: number;
    quantity?: number;
    unitprice?: number;
}

export interface OrderDetail  {
    discount: number;
    orderid: number;
    productid: number;
    quantity: number;
    unitprice: number;
}
