from django import forms


class SessionActionForm(forms.Form):
    meeting_link = forms.URLField(required=False)
