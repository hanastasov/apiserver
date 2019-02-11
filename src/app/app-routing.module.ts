import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HomeComponent } from './home/home.component';

import { PageNotFoundComponent } from './error-routing/not-found/not-found.component';
import { UncaughtErrorComponent } from './error-routing/error/uncaught-error.component';
import { ErrorRoutingModule } from './error-routing/error-routing.module';
import { GridComponent } from './grid/grid.component';
import { FinjsGridComponent } from './finjs/finjsgrid.component';
import { GridRemoteVirtualizationSampleComponent } from './apiserver-dynamic/grid-sample-4.component';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent, data: { text: 'Home' } },
  { path: 'error', component: UncaughtErrorComponent },
  { path: 'Northwind', component: GridComponent, data: { text: 'Northwind' } },
  { path: 'finjs', component: FinjsGridComponent, data: { text: 'FinJS' } },
  { path: 'ignite', component: GridRemoteVirtualizationSampleComponent, data: { text: 'Dynamic Ignite' } },
  { path: '**', component: PageNotFoundComponent } // must always be last
];

@NgModule({
  imports: [RouterModule.forRoot(routes), ErrorRoutingModule],
  exports: [RouterModule, ErrorRoutingModule]
})
export class AppRoutingModule {
}
