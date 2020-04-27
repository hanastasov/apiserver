import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PageNotFoundComponent } from './error-routing/not-found/not-found.component';
import { UncaughtErrorComponent } from './error-routing/error/uncaught-error.component';
import { ErrorRoutingModule } from './error-routing/error-routing.module';
import { MainComponent } from './main/main.component';

export const routes: Routes = [
  { path: '', redirectTo: '/Northwind', pathMatch: 'full' },
  { path: 'error', component: UncaughtErrorComponent },
  { path: 'Northwind', component: MainComponent, data: { text: 'Northwind' } },
  { path: '**', component: PageNotFoundComponent } // must always be last
];

@NgModule({
  imports: [RouterModule.forRoot(routes), ErrorRoutingModule],
  exports: [RouterModule, ErrorRoutingModule]
})
export class AppRoutingModule {
}
