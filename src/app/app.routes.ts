import { Routes } from '@angular/router';
import { AuthComponent } from './pages/auth-component/auth-component';
import { PagosListComponent } from './pages/pagos-list-component/pagos-list-component';

export const routes: Routes = [
    { path: 'auth', component: AuthComponent },
    { path: 'pagos', component: PagosListComponent },
    { path: '', redirectTo: 'auth', pathMatch: 'full' },
    { path: '**', redirectTo: 'login' }
];
