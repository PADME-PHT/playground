import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PlaygroundComponent } from './components/playground/playground.component';
import { SearchComponent } from './components/search/search.component';
import { AuthGuardService as AuthGuard } from './services/auth-guard';

const routes: Routes = [
  { path: '', component: SearchComponent, canActivate: [AuthGuard]},
  { path: 'playground', component: PlaygroundComponent, canActivate: [AuthGuard]},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
