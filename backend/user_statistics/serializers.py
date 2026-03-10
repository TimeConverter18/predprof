from rest_framework import serializers

from users.models import User


class LeaderBoardSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['username', 'rating']



class StatisticsAboutTasksSerializer(serializers.Serializer):
    not_solved = serializers.IntegerField()
    correct_solved = serializers.IntegerField()
    incorrect_solved = serializers.IntegerField()
