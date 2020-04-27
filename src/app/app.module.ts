import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { IgxPieChartModule } from 'igniteui-angular-charts';
import { IgxCategoryChartModule } from 'igniteui-angular-charts';
import { IgxRippleModule, IgxGridModule, IgxBadgeModule, IgxToastModule, IgxComboModule } from 'igniteui-angular';

import { AppComponent } from './app.component';
import { RemoteDataService, } from './services/remoteData.service';
import { HttpClientModule } from '@angular/common/http';
import { AddRowComponent } from './grid-add-row/addrow.component';
import { MainComponent } from './main/main.component';

@NgModule({
  declarations: [
    AppComponent,
    AddRowComponent,
    MainComponent
  ],
  imports: [
    FormsModule,
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    AppRoutingModule,
    IgxCategoryChartModule,
    IgxPieChartModule,
    IgxComboModule,
    IgxRippleModule,
    IgxGridModule,
    IgxBadgeModule,
    IgxToastModule
  ],
  providers: [RemoteDataService],
  bootstrap: [AppComponent]
})
export class AppModule {
}
