from django.contrib import admin

from tasks.models import Task, Subject, SubjectTheme

admin.site.register(Task)
admin.site.register(Subject),
admin.site.register(SubjectTheme)
