# Kubernetes Manifests

Kubernetes манифесты и Helm charts для деплоя сервисов.

## Назначение

Манифесты для деплоя сервисов в Kubernetes:
- Deployment манифесты
- Service манифесты
- ConfigMap и Secrets
- Helm charts (если используются)

## Структура

```
k8s/
├─ configurator-site/     # Манифесты для configurator_site
├─ infrastructure/        # Манифесты для инфраструктуры (PostgreSQL, Redis)
└─ helm/                  # Helm charts (если используются)
```

## Использование

```bash
# Применение манифестов
kubectl apply -f k8s/configurator-site/

# С Helm
helm install configurator-site ./helm/configurator-site
```

