# Guide — Diagrammes UML pour le projet MauriBus

Envoie ces deux prompts à une autre IA (ChatGPT, Gemini, etc.) pour générer les diagrammes.

---

## PROMPT 1 — Diagramme de Classes UML

```
Génère un diagramme de classes UML complet (format PlantUML ou Mermaid) pour l'application MauriBus, un système de gestion de transport urbain en Mauritanie.

Voici les modèles du système :

=== MODÈLES DJANGO (Backend) ===

class Admin {
  id: UUID (PK)
  matricule: String (unique)
  nom: String
  prenom: String
  email: String
  password: String
  role: Enum [SUPERADMIN, ADMIN, MODERATEUR]
  statut: Enum [ACTIF, SUSPENDU, INACTIF]
  derniere_connexion: DateTime
}

class Driver {
  id: UUID (PK)
  matricule: String (unique)
  nom: String
  prenom: String
  telephone: String
  email: String
  password: String
  statut: Enum [ACTIF, SUSPENDU, INACTIF]
  is_online: Boolean
  push_token: String
  derniere_connexion: DateTime
}

class Bus {
  id: UUID (PK)
  numero_bus: String (unique)
  plaque: String (unique)
  marque: String
  modele: String
  capacite: Integer
  statut: Enum [ACTIF, EN_PANNE, MAINTENANCE, INACTIF]
  chauffeur: FK → Driver (OneToOne, nullable)
  date_creation: DateTime
}

class Line {
  id: UUID (PK)
  code: String (unique)
  nom: String
  terminus_depart: String
  terminus_arrivee: String
  distance_km: Decimal
  duree_estimee_min: Integer
  tarif: Decimal
  frequence_min: Integer
  couleur_ligne: String
  statut: Enum [ACTIVE, INACTIVE, SUSPENDUE]
}

class Stop {
  id: UUID (PK)
  nom: String
  latitude: Decimal
  longitude: Decimal
  ordre: Integer
  ligne: FK → Line
}

class Trip {
  id: UUID (PK)
  driver: FK → Driver
  bus: FK → Bus (nullable)
  ligne: FK → Line (nullable)
  statut: Enum [PLANIFIEE, EN_COURS, PAUSE, COMPLETEE, ANNULEE]
  date_debut: DateTime
  date_fin: DateTime
  date_planifiee: DateTime
  nombre_passagers: Integer
  revenus: Decimal
  distance_reelle_km: Decimal
  duree_reelle_secondes: Integer
  notes: String
}

class GPSPosition {
  id: UUID (PK)
  trajet: FK → Trip (nullable)
  bus: FK → Bus (nullable)
  latitude: Decimal
  longitude: Decimal
  vitesse_kmh: Decimal
  direction_degres: Decimal
  precision: Decimal
  date_creation: DateTime
}

class Report {
  id: UUID (PK)
  chauffeur: FK → Driver
  bus: FK → Bus (nullable)
  titre: String
  description: String
  type_signalement: Enum [PANNE, ACCIDENT, RETARD, COMPORTEMENT, AUTRE]
  priorite: Enum [BASSE, NORMALE, HAUTE, URGENTE]
  statut: Enum [NOUVEAU, EN_COURS, RESOLU, FERME]
  date_creation: DateTime
}

class Notification {
  id: UUID (PK)
  titre: String
  message: String
  type_notification: Enum [BROADCAST, INDIVIDUELLE]
  destinataire: FK → Driver (nullable)
  envoye_par: String
  date_creation: DateTime
}

class Payment {
  id: UUID (PK)
  chauffeur: FK → Driver
  montant: Decimal
  statut: Enum [EN_ATTENTE, EFFECTUE, ANNULE]
  type_paiement: Enum [SALAIRE, PRIME, AVANCE]
  code_unique: String
  date_creation: DateTime
}

class CitizenUser {
  id: UUID (PK)
  telephone: String (unique)
  nom: String
  prenom: String
  nni: String
  email: String
  password: String
  statut: Enum [ACTIF, SUSPENDU, INACTIF]
  push_token: String
  date_creation: DateTime
}

class WalletCitizen {
  id: UUID (PK)
  citoyen: OneToOne → CitizenUser
  balance: Decimal
  date_creation: DateTime
  date_mise_a_jour: DateTime
}

class WalletDriver {
  id: UUID (PK)
  chauffeur: OneToOne → Driver
  balance: Decimal
  date_creation: DateTime
  date_mise_a_jour: DateTime
}

class WalletTransaction {
  id: UUID (PK)
  citoyen: FK → CitizenUser
  montant: Decimal
  type_transaction: Enum [RECHARGE, PAIEMENT, REMBOURSEMENT]
  statut: Enum [EN_ATTENTE, VALIDE, REFUSE]
  description: String
  reference_bankily: String
  photo_bankily: Image
  valide_par: String
  date_creation: DateTime
  date_validation: DateTime
}

class CitizenTrip {
  id: UUID (PK)
  ticket_code: UUID (unique)
  citoyen: FK → CitizenUser
  ligne: FK → Line (nullable)
  trajet: FK → Trip (nullable)
  bus: FK → Bus (nullable)
  montant_paye: Decimal
  statut: Enum [PAYE, UTILISE, ANNULE]
  methode_paiement: String
  date_paiement: DateTime
  date_utilisation: DateTime
}

class DriverRating {
  id: UUID (PK)
  citoyen: FK → CitizenUser
  chauffeur: FK → Driver
  citizen_trip: OneToOne → CitizenTrip
  note: Integer (1-5)
  commentaire: String
  date_creation: DateTime
}

class AppWallet {
  id: Integer (PK, singleton)
  balance: Decimal
  date_creation: DateTime
  date_mise_a_jour: DateTime
}

class AppTransaction {
  id: UUID (PK)
  type_transaction: Enum [COMMISSION, PAIEMENT_CHAUFFEUR, RECHARGE_BANQUE]
  montant: Decimal
  description: String
  chauffeur: FK → Driver (nullable)
  effectue_par: String
  solde_avant: Decimal
  solde_apres: Decimal
  date_creation: DateTime
}

=== RELATIONS ===
- Bus >-- Driver : chauffeur (0..1 — 1)
- Bus >-- Line : ManyToMany via bus_lignes
- Stop >-- Line : FK (Many stops per line)
- Trip >-- Driver : FK
- Trip >-- Bus : FK (nullable)
- Trip >-- Line : FK (nullable)
- GPSPosition >-- Trip : FK (nullable)
- GPSPosition >-- Bus : FK (nullable)
- Report >-- Driver : FK
- Report >-- Bus : FK (nullable)
- Notification >-- Driver : FK (nullable, for individual)
- Payment >-- Driver : FK
- WalletCitizen >-- CitizenUser : OneToOne
- WalletDriver >-- Driver : OneToOne
- WalletTransaction >-- CitizenUser : FK
- CitizenTrip >-- CitizenUser : FK
- CitizenTrip >-- Line : FK (nullable)
- CitizenTrip >-- Trip : FK (nullable)
- CitizenTrip >-- Bus : FK (nullable)
- DriverRating >-- CitizenUser : FK
- DriverRating >-- Driver : FK
- DriverRating >-- CitizenTrip : OneToOne
- AppTransaction >-- Driver : FK (nullable)

Génère le diagramme en PlantUML avec :
- Les classes groupées par domaine (Admin, Transport, Citoyen, Finance)
- Les multiplicités sur chaque relation
- Les types de données indiqués
```

---

## PROMPT 2 — Diagramme de Cas d'Utilisation UML

```
Génère un diagramme de cas d'utilisation UML (format PlantUML) pour l'application MauriBus.

=== ACTEURS ===
1. Super Administrateur
2. Administrateur
3. Modérateur
4. Chauffeur (via application mobile Driver)
5. Citoyen (via application mobile Citizen)
6. Système (actions automatiques)

=== CAS D'UTILISATION PAR ACTEUR ===

SUPER ADMINISTRATEUR (hérite des droits Admin) :
- Gérer les administrateurs (créer, modifier, suspendre, supprimer)
- Gérer le wallet de l'application (voir solde, transactions)
- Accéder aux statistiques globales
- Toutes les actions de l'Administrateur

ADMINISTRATEUR :
- Se connecter / Se déconnecter
- Gérer les chauffeurs (CRUD + suspension)
- Gérer les bus (CRUD + assignation chauffeur)
- Gérer les lignes (CRUD + arrêts)
- Planifier des trajets
- Envoyer des notifications (broadcast + individuelle)
- Gérer les paiements chauffeurs
- Valider les recharges wallet citoyens
- Consulter les signalements
- Voir la carte en temps réel (positions GPS)
- Voir les statistiques (trajets, revenus, passagers)

MODÉRATEUR :
- Se connecter / Se déconnecter
- Consulter (lecture seule) : chauffeurs, bus, lignes, trajets
- Consulter les signalements

CHAUFFEUR :
- Se connecter / Se déconnecter (app mobile)
- Voir son tableau de bord (bus assigné, trajets planifiés)
- Démarrer / Terminer un trajet
- Mettre un trajet en pause / Reprendre
- Envoyer sa position GPS
- Valider un ticket citoyen (scanner QR code)
- Créer un signalement (incident, panne)
- Voir ses notifications
- Voir ses paiements
- Mettre à jour sa progression d'arrêts

CITOYEN :
- Créer un compte
- Se connecter / Se déconnecter
- Voir les lignes de bus disponibles
- Voir les détails d'une ligne (arrêts, tarif)
- Voir les bus en temps réel sur la carte
- Payer un trajet (débit wallet)
- Voir son ticket QR généré
- Recharger son wallet (via Bankily)
- Voir l'historique de ses transactions
- Voir l'historique de ses trajets
- Noter un chauffeur (1-5 étoiles)
- Voir ses notifications
- Modifier son profil

SYSTÈME :
- Générer des tokens JWT à la connexion
- Auto-fermer les trajets actifs à la connexion du chauffeur
- Créer automatiquement un WalletCitizen à l'inscription
- Envoyer des notifications push (Expo)

=== INCLUSIONS (<<include>>) ===
- "Payer un trajet" <<include>> "Vérifier solde wallet"
- "Valider recharge" <<include>> "Créditer wallet citoyen"
- "Démarrer trajet" <<include>> "Fermer trajet précédent actif"

=== EXTENSIONS (<<extend>>) ===
- "Voir ligne" <<extend>> "Payer ce trajet"
- "Terminer trajet" <<extend>> "Mettre à jour statistiques"

Génère le diagramme en PlantUML avec :
- Les acteurs clairement séparés
- Les frontières de système
- Les relations <<include>> et <<extend>> indiquées
- Groupement par domaine fonctionnel
```
