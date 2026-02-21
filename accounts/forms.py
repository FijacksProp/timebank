from django import forms
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User


class SignUpForm(UserCreationForm):
    email = forms.EmailField(required=True)

    class Meta:
        model = User
        fields = ('username', 'email', 'password1', 'password2')


class OnboardingForm(forms.Form):
    full_name = forms.CharField(max_length=120)
    bio = forms.CharField(required=False, widget=forms.Textarea(attrs={'rows': 3}))
    timezone = forms.CharField(max_length=64, initial='UTC')
    languages = forms.CharField(required=False, help_text='Example: English, French')
    level = forms.ChoiceField(choices=[('beginner', 'Beginner'), ('intermediate', 'Intermediate'), ('advanced', 'Advanced')])
    offered_skills = forms.CharField(help_text='Comma-separated skills you can teach')
    wanted_skills = forms.CharField(help_text='Comma-separated skills you want to learn')
