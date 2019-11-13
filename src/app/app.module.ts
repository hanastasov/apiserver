import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { IgxPieChartModule } from 'igniteui-angular-charts/ES5/igx-pie-chart-module';
import { IgxCategoryChartModule } from 'igniteui-angular-charts/ES5/igx-category-chart-module';
import { IgxNavigationDrawerModule, IgxNavbarModule, IgxLayoutModule, IgxRippleModule, IgxGridModule,
  IgxCheckboxModule, IgxBadgeModule, IgxToastModule, IgxComboModule } from 'igniteui-angular';

import { AppComponent } from './app.component';
import { GridComponent } from './grid/grid.component';
import { RemoteDataService, } from './services/remoteData.service';

import { GridRemoteVirtualizationSampleComponent } from './apiserver-dynamic/grid-sample-4.component';
import { HttpClientModule } from '@angular/common/http';
import { AddRowComponent } from './grid-add-row/addrow.component';

@NgModule({
  declarations: [
    AppComponent,
    AddRowComponent,
    GridComponent,
    GridRemoteVirtualizationSampleComponent
  ],
  imports: [
    FormsModule,
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    AppRoutingModule,
    IgxNavigationDrawerModule,
    IgxCategoryChartModule,
    IgxNavbarModule,
    IgxPieChartModule,
    IgxComboModule,
    IgxLayoutModule,
    IgxRippleModule,
    IgxGridModule,
    IgxCheckboxModule,
    IgxBadgeModule,
    IgxToastModule
  ],
  providers: [RemoteDataService],
  bootstrap: [AppComponent]
})
export class AppModule {
}
