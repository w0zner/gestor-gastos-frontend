import { AsyncPipe, NgIf } from '@angular/common';
import { Component, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Auth, user } from '@angular/fire/auth';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-navigation-component',
  imports: [
    RouterLink,
    NgIf,
    AsyncPipe
  ],
  templateUrl: './navigation-component.html',
  styleUrl: './navigation-component.css',
})
export class NavigationComponent {
  private router = inject(Router);
  private auth = inject(Auth);

  usuario$ = user(this.auth);
  //user = toSignal(user(this.auth), { initialValue: null });

  /* constructor() {
    effect(() => {
      console.log(this.user());
    });
  } */

  cerrarSesion() {
    try {
      this.auth.signOut().then((result) => {
        this.router.navigateByUrl('/auth');
      });
    } catch (error) {
      console.error('Error al cerrar sesión' + error);
    }
  }
}
