import { AsyncPipe, NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Auth, user } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { SidebarService } from '../../../services/sidebar-service';

@Component({
  selector: 'app-navigation-component',
  imports: [
    NgIf,
    AsyncPipe
  ],
  templateUrl: './navigation-component.html',
  styleUrl: './navigation-component.css',
})
export class NavigationComponent {
  private router = inject(Router);
  private auth = inject(Auth);
  sidebarService = inject(SidebarService);

  usuario$ = user(this.auth);

  cerrarSesion() {
    try {
      this.auth.signOut().then(() => {
        this.router.navigateByUrl('/auth');
      });
    } catch (error) {
      console.error('Error al cerrar sesión', error);
    }
  }
}
