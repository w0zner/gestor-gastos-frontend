import { Routes } from '@angular/router';
import { AuthGuard } from '@angular/fire/auth-guard';

export const routes: Routes = [
  {
    path: 'auth',
    loadComponent: () =>
      import('./pages/auth-component/auth-component').then((m) => m.AuthComponent),
  },
  {
    path: 'inicio',
    loadComponent: () =>
      import('./pages/parcial/inicio-component/inicio-component').then(
        (m) => m.InicioComponent
      ),
    canActivate: [AuthGuard],
    children: [
      {
        path: 'pagos',
        loadComponent: () =>
          import('./pages/pagos-list-component/pagos-list-component').then(
            (m) => m.PagosListComponent
          ),
      },
      {
        path: 'plantillas',
        loadComponent: () =>
          import(
            './pages/plantillas-list-component/plantillas-list-component'
          ).then((m) => m.PlantillasListComponent),
      },
      {
        path: 'categorias',
        loadComponent: () =>
          import(
            './pages/categorias-list-component/categorias-list-component'
          ).then((m) => m.CategoriasListComponent),
      },
      {
        path: 'estados',
        loadComponent: () =>
          import('./pages/estados-list-component/estados-list-component').then(
            (m) => m.EstadosListComponent
          ),
      },
      { path: '', redirectTo: 'pagos', pathMatch: 'full' },
    ],
  },
  { path: '', redirectTo: 'auth', pathMatch: 'full' },
  { path: '**', redirectTo: 'auth' },
];
