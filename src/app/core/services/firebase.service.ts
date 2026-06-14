import { Injectable } from '@angular/core';
import { from, Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  initializeApp, getApps, getApp, FirebaseApp
} from 'firebase/app';
import {
  getFirestore, Firestore,
  collection, doc, addDoc, getDoc, getDocs,
  query, where, orderBy, limit, startAfter,
  DocumentSnapshot, QueryDocumentSnapshot, Timestamp
} from 'firebase/firestore';
import { environment } from '../../../environments/environment';
import { Recipe, CookingStyle } from '../models/recipe.model';

/** Initializes Firebase once and exposes Firestore CRUD operations. */
@Injectable({ providedIn: 'root' })
export class FirebaseService {
  private readonly app: FirebaseApp;
  private readonly db: Firestore;
  private readonly RECIPES_COLLECTION = 'recipes';

  constructor() {
    this.app = getApps().length ? getApp() : initializeApp(environment.firebase);
    this.db = getFirestore(this.app);
  }

  /**
   * Saves a recipe document to Firestore.
   * @param recipe - The recipe to persist (without id).
   * @returns Observable emitting the auto-generated document id.
   */
  saveRecipe(recipe: Omit<Recipe, 'id'> & { clientId?: string }): Observable<string> {
    const ref = collection(this.db, this.RECIPES_COLLECTION);
    const flatHelpers = (recipe.helpers ?? []).flatMap((group, groupIdx) =>
      (group ?? []).map(task => ({ ...task, groupIndex: groupIdx }))
    );
    const data = {
      ...recipe,
      helpers: flatHelpers,
      createdAt: Timestamp.fromDate(recipe.createdAt)
    };
    return from(addDoc(ref, data)).pipe(
      map(docRef => docRef.id),
      catchError(err => throwError(() => new Error(`Rezept konnte nicht gespeichert werden: ${err.message}`)))
    );
  }

  /** Returns the subset of clientIds that already exist as saved recipes in Firestore. */
  getSavedClientIds(clientIds: string[]): Observable<string[]> {
    if (clientIds.length === 0) return from(Promise.resolve([]));
    const ref = collection(this.db, this.RECIPES_COLLECTION);
    const q = query(ref, where('clientId', 'in', clientIds));
    return from(getDocs(q)).pipe(
      map(snap => snap.docs.map(d => d.data()['clientId'] as string).filter(Boolean)),
      catchError(() => from(Promise.resolve([])))
    );
  }

  /**
   * Loads a single recipe by its Firestore document id.
   * @param id - The document id.
   * @returns Observable emitting the Recipe or null when not found.
   */
  getRecipeById(id: string): Observable<Recipe | null> {
    const ref = doc(this.db, this.RECIPES_COLLECTION, id);
    return from(getDoc(ref)).pipe(
      map(snap => this.mapSnapshot(snap)),
      catchError(err => throwError(() => new Error(`Rezept konnte nicht geladen werden: ${err.message}`)))
    );
  }

  /**
   * Loads a paginated, optionally style-filtered list of recipes.
   * @param pageSize - Number of results per page.
   * @param lastDoc - Last document from the previous page for cursor pagination.
   * @param style - Optional cooking style filter.
   * @returns Observable emitting an array of recipes.
   */
  getRecipes(
    pageSize = 20,
    lastDoc?: QueryDocumentSnapshot,
    style?: CookingStyle
  ): Observable<Recipe[]> {
    const ref = collection(this.db, this.RECIPES_COLLECTION);
    // No where() here — combining where+orderBy on different fields requires a
    // Firestore composite index. Filter by style client-side instead.
    const constraints: any[] = [orderBy('createdAt', 'desc'), limit(pageSize)];
    if (lastDoc) constraints.push(startAfter(lastDoc));

    const q = query(ref, ...constraints);
    return from(getDocs(q)).pipe(
      map(snap => {
        const all = snap.docs.map(d => this.mapSnapshot(d) as Recipe);
        return style ? all.filter(r => r.cookingStyle === style) : all;
      }),
      catchError(err => {
        console.error('[FirebaseService] getRecipes error:', err);
        return throwError(() => new Error(`Rezepte konnten nicht geladen werden: ${err.message}`));
      })
    );
  }

  private mapSnapshot(
    snap: DocumentSnapshot | QueryDocumentSnapshot
  ): Recipe | null {
    if (!snap.exists()) return null;
    const data = snap.data() as any;
    return {
      ...data,
      id: snap.id,
      createdAt: data['createdAt'] instanceof Timestamp
        ? data['createdAt'].toDate()
        : new Date(data['createdAt'])
    } as Recipe;
  }
}
