import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Screen1RoutingModule } from './screen1-routing.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { InfragisticsImportsModule } from '../infragistics-imports/infragistics-imports.module';
import { Screen1Component } from './screen1/screen1.component';
@NgModule({
    declarations: [Screen1Component],
    imports: [
        CommonModule,
        Screen1RoutingModule,
        BrowserAnimationsModule,
        ReactiveFormsModule,
        FormsModule,
        InfragisticsImportsModule
    ],
    exports: [
        Screen1Component
    ]
})
export class Screen1Module {
}
