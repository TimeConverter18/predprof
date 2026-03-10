import csv
import io
import json

from django.core.paginator import Paginator
from django.http import JsonResponse, HttpResponse
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from rest_framework.viewsets import ModelViewSet
from rest_framework.parsers import MultiPartParser

from tasks.models import Subject, Task, SubjectTheme, TaskDifficulty
from tasks.serializers import SubjectsListSerializer, CurrentTaskSerializer, BaseTaskSerializer, TaskSerializer


class ReturnTaskAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, subject_id: int):
        task = get_object_or_404(Task, id=subject_id)
        serializer = CurrentTaskSerializer(task, context={'request': request})
        return Response(serializer.data)


class SubjectsListAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        subjects = Subject.objects.prefetch_related('tasks').only('id', 'name')
        serializer = SubjectsListSerializer(subjects, many=True)
        return Response(serializer.data)


class TasksListAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        subject_id = request.query_params.get('subject_id', '').strip()
        difficulty = request.query_params.get('difficulty', '').strip()

        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 10))

        queryset = Task.objects.select_related('subject').only(
            'id', 'question', 'subject__id', 'subject__name', 'difficulty'
        )

        if subject_id:
            try:
                queryset = queryset.filter(subject_id=int(subject_id))
            except ValueError:
                pass

        if difficulty:
            queryset = queryset.filter(difficulty=difficulty)

        paginator = Paginator(queryset, page_size)
        page_obj = paginator.get_page(page)

        serializer = BaseTaskSerializer(
            page_obj.object_list,
            many=True,
            context={'request': request}
        )

        return Response({
            'items': serializer.data,
            'page': page,
            'items_count': paginator.count,
            'total_pages': paginator.num_pages,
        })


class TaskViewSet(ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    permission_classes = [IsAdminUser]


class CheckTaskView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            task = Task.objects.get(pk=pk)
        except Task.DoesNotExist:
            return Response({"error": "Задача не найдена"}, status=404)

        user_answer = request.data.get("answer")

        if not user_answer:
            return Response({"error": "Поле answer обязательно"}, status=400)

        is_correct = user_answer.strip().lower() == task.correct_answer.strip().lower()

        return Response({"is_correct": is_correct})



class ImportTasksView(APIView):
    permission_classes = [IsAdminUser]
    parser_classes = [MultiPartParser]

    def post(self, request):
        file = request.FILES.get("file")

        if not file:
            return Response({"error": "Файл не передан"}, status=400)

        filename = file.name.lower()

        try:
            if filename.endswith(".json"):
                tasks_data = self._parse_json(file)
            elif filename.endswith(".csv"):
                tasks_data = self._parse_csv(file)
            else:
                return Response({"error": "Поддерживаются только .json и .csv"}, status=400)
        except Exception as e:
            return Response({"error": f"Ошибка парсинга: {str(e)}"}, status=400)

        created, errors = self._create_tasks(tasks_data)

        return Response({
            "created": created,
            "errors": errors,
        }, status=201 if created else 400)

    def _parse_json(self, file):
        data = json.load(file)
        return data if isinstance(data, list) else data.get("tasks", [])

    def _parse_csv(self, file):
        text = io.TextIOWrapper(file, encoding="utf-8")
        reader = csv.DictReader(text)
        return list(reader)

    def _create_tasks(self, tasks_data):
        created = 0
        errors = []

        for i, row in enumerate(tasks_data):
            try:
                subject_name = row.get("subject")
                if not subject_name:
                    errors.append({"row": i + 1, "error": "Поле subject обязательно"})
                    continue

                subject, _ = Subject.objects.get_or_create(name=subject_name.strip())

                theme = None
                theme_name = row.get("theme")
                if theme_name:
                    theme, _ = SubjectTheme.objects.get_or_create(
                        name=theme_name.strip(),
                        defaults={"subject": subject}
                    )

                difficulty = row.get("difficulty", TaskDifficulty.EASY)
                valid = [c.value for c in TaskDifficulty]
                if difficulty not in valid:
                    difficulty = TaskDifficulty.EASY

                Task.objects.create(
                    subject=subject,
                    theme=theme,
                    question=row.get("question", "").strip(),
                    solution=row.get("solution", "").strip(),
                    correct_answer=row.get("correct_answer", "").strip(),
                    difficulty=difficulty,
                )
                created += 1

            except Exception as e:
                errors.append({"row": i + 1, "error": str(e)})

        return created, errors



class TaskExportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        export_format = request.query_params.get('export_format', 'json')
        theme_id = request.query_params.get('theme_id')
        subject_id = request.query_params.get('subject_id')

        tasks = Task.objects.select_related('subject', 'theme').all()

        if theme_id:
            tasks = tasks.filter(theme_id=theme_id)
        if subject_id:
            tasks = tasks.filter(subject_id=subject_id)

        data = [
            {
                'id': t.id,
                'question': t.question,
                'solution': t.solution,
                'correct_answer': t.correct_answer,
                'difficulty': t.difficulty,
                'subject': t.subject.name,
                'theme': t.theme.name if t.theme else None,
            }
            for t in tasks
        ]

        if format == 'csv':
            return self._csv_response(data)
        return JsonResponse(data, safe=False, json_dumps_params={'ensure_ascii': False})

    def _csv_response(self, data):
        if not data:
            return HttpResponse('No data', content_type='text/plain')

        response = HttpResponse(content_type='text/csv; charset=utf-8')
        response['Content-Disposition'] = 'attachment; filename="tasks.csv"'
        response.write('\ufeff')

        writer = csv.DictWriter(response, fieldnames=data[0].keys())
        writer.writeheader()
        writer.writerows(data)

        return response
