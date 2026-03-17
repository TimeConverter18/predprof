from django.conf import settings
from django.shortcuts import render
from rest_framework.generics import RetrieveAPIView
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView
from users.models import User, UserTask
from users.serializers import UserStatsSerializer
from tasks.models import Task
from pvp.models import Round


class UserStatsApiView(RetrieveAPIView):
    serializer_class = UserStatsSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        pk = self.kwargs.get('pk')
        if pk:
            return User.objects.get(pk=pk)
        return self.request.user


class AdminUsersListApiView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        users = User.objects.filter(is_active=True).order_by('-rating')
        total_tasks = Task.objects.count()
        delta_val = getattr(settings, 'DELTA', 25)

        result = []
        for u in users:
            correct = UserTask.objects.filter(user=u, is_correct=True).count()
            wrong = UserTask.objects.filter(user=u, is_correct=False).count()
            unsolved = max(total_tasks - correct - wrong, 0)

            recent_rounds = (
                Round.objects.filter(
                    roundplayer__player=u,
                    status='finished'
                )
                .order_by('-finished_at')[:10]
            )

            changes = []
            for rnd in recent_rounds:
                if rnd.winner_id == u.id:
                    changes.append(delta_val)
                elif rnd.winner_id is None:
                    changes.append(int(delta_val * 0.5))
                else:
                    changes.append(-delta_val)

            changes.reverse()
            cur = u.rating
            for ch in changes:
                cur -= ch
            history = []
            for ch in changes:
                cur += ch
                history.append(cur)

            if not history:
                history = [u.rating]

            result.append({
                'id': u.id,
                'name': u.username,
                'email': u.email,
                'rating': u.rating,
                'correct': correct,
                'wrong': wrong,
                'unsolved': unsolved,
                'history': history,
            })

        return Response(result)


def render_profile_page(request):
    return render(request, 'profile.html')