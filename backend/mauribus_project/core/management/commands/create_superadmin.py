from django.core.management.base import BaseCommand
from django.contrib.auth.hashers import make_password
from core.models import Admin

class Command(BaseCommand):
    help = 'Creer un compte Super Administrateur'

    def add_arguments(self, parser):
        parser.add_argument('--nom', default='Admin', help='Nom')
        parser.add_argument('--prenom', default='Super', help='Prenom')
        parser.add_argument('--email', default='admin@mauribus.mr', help='Email')
        parser.add_argument('--telephone', default='00000000', help='Telephone')
        parser.add_argument('--nni', default='1234567890', help='NNI')
        parser.add_argument('--password', default='Admin@2024', help='Mot de passe')

    def handle(self, *args, **options):
        email = options['email']
        if Admin.objects.filter(email=email).exists():
            self.stdout.write(self.style.WARNING(f'Un admin avec email {email} existe deja.'))
            existing = Admin.objects.get(email=email)
            self.stdout.write(f'Matricule: {existing.matricule}')
            return

        matricule = Admin.generate_matricule()
        admin = Admin.objects.create(
            matricule=matricule,
            nom=options['nom'],
            prenom=options['prenom'],
            email=email,
            telephone=options['telephone'],
            nni=options['nni'],
            password=make_password(options['password']),
            role='SUPER_ADMIN',
            statut='ACTIF',
            is_active=True,
            is_staff=True,
            is_superuser=True,
        )

        self.stdout.write(self.style.SUCCESS('Super Admin cree avec succes!'))
        self.stdout.write(f'  Matricule : {admin.matricule}')
        self.stdout.write(f'  Email     : {admin.email}')
        self.stdout.write(f'  Password  : {options["password"]}')
