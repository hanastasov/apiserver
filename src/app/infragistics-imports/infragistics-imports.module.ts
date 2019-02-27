import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IgxButtonGroupModule, IgxGridModule, IgxIconModule } from 'igniteui-angular';
@NgModule({
    declarations: [],
    imports: [
        CommonModule,
        IgxButtonGroupModule,
        IgxGridModule.forRoot(),
        IgxIconModule
    ],
    exports: [
        IgxButtonGroupModule,
        IgxGridModule,
        IgxIconModule
    ]
})
export class InfragisticsImportsModule {
}
