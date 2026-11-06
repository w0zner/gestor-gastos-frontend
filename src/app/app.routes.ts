import { Routes } from '@angular/router';
import { AuthComponent } from './pages/auth-component/auth-component';
import { PagosListComponent } from './pages/pagos-list-component/pagos-list-component';
import { InicioComponent } from './pages/parcial/inicio-component/inicio-component';
import { AuthGuard, redirectUnauthorizedTo } from '@angular/fire/auth-guard';
export const routes: Routes = [
    { path: 'auth', component: AuthComponent },


    {
      path: 'inicio', component: InicioComponent,
      canActivate: [AuthGuard],
     //data: { authGuardPipe: redirectUnauthorizedTo(['auth']) },
        children: [
          { path: 'pagos', component: PagosListComponent },
          { path: '', redirectTo: 'pagos', pathMatch: 'full' }, // Por defecto muestra pagos
          // { path: 'categorias', component: CategoriasComponent }
        ]
    },

    { path: '', redirectTo: 'auth', pathMatch: 'full' },
    { path: '**', redirectTo: 'auth' }
];
