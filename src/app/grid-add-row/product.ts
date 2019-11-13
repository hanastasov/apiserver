export class Product {
    public ProductID: number;
    public ProductName: string;
    public QuantityPerUnit: string;
    public ReorderLevel: number;
    public UnitPrice: number;
    public UnitsInStock: number;

    constructor() {
        this.ProductID = 0;
        this.ProductName = '';
        this.QuantityPerUnit = '';
        this.ReorderLevel = 0;
        this.UnitPrice = 0;
        this.UnitsInStock = 0;
    }
}
