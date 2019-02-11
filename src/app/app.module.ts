import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { IgxNavigationDrawerModule, IgxNavbarModule, IgxLayoutModule, IgxRippleModule, IgxGridModule,
  IgxCheckboxModule, IgxBadgeModule, IgxToastModule } from 'igniteui-angular';

import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { GridComponent } from './grid/grid.component';
import { RemoteFilteringService } from './services/remoteData.service';
import { FinjsGridComponent } from './finjs/finjsgrid.component';
import { GridRemoteVirtualizationSampleComponent } from './apiserver-dynamic/grid-sample-4.component';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    GridComponent,
    FinjsGridComponent,
    GridRemoteVirtualizationSampleComponent
  ],
  imports: [
    FormsModule,
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    IgxNavigationDrawerModule,
    IgxNavbarModule,
    IgxLayoutModule,
    IgxRippleModule,
    IgxGridModule,
    IgxCheckboxModule,
    IgxBadgeModule,
    IgxToastModule
  ],
  providers: [RemoteFilteringService],
  bootstrap: [AppComponent]
})
export class AppModule {
}
