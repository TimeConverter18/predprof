from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from tasks.models import Task
from user_statistics.serializers import LeaderBoardSerializer, StatisticsAboutTasksSerializer
from users.models import User, UserTask


class LeaderBoard(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        leader_board = User.objects.filter(is_active=True).order_by('-rating').only(
            'username', 'rating'
        )[:10]
        print(leader_board.query)
        serializer = LeaderBoardSerializer(leader_board, many=True)
        return Response(serializer.data)


class StatisticsAboutTasks(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user_id = request.query_params.get('user_id')

        if not user_id:
            return Response({"error": "Id пользователя не передан"}, status=status.HTTP_400_BAD_REQUEST)

        count_all_tasks = Task.objects.count()
        count_correct_tasks = UserTask.objects.filter(is_correct=True, user_id=user_id).count()
        count_incorrect_tasks = UserTask.objects.filter(is_correct=False, user_id=user_id).count()
        count_not_solved = count_all_tasks - count_correct_tasks - count_incorrect_tasks

        serializer = StatisticsAboutTasksSerializer(data={
            'not_solved': count_not_solved,
            'correct_solved': count_correct_tasks,
            'incorrect_solved': count_incorrect_tasks,
        })

        serializer.is_valid(raise_exception=True)
        return Response(serializer.data)
