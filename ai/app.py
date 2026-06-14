import os
import json
from flask import Flask, request, jsonify
import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
import traceback

app = Flask(__name__)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'service': 'ai-finance'})

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.json
        transactions = data.get('transactions', [])
        user_id = data.get('userId', '')

        if len(transactions) < 7:
            return jsonify({'predictions': None, 'message': 'Insufficient data'})

        df = pd.DataFrame(transactions)
        df['date'] = pd.to_datetime(df['date'])
        df = df.sort_values('date')

        expenses = df[df['type'] == 'expense'].copy()
        if len(expenses) < 7:
            return jsonify({'predictions': None, 'message': 'Insufficient expense data'})

        expenses['dayofweek'] = expenses['date'].dt.dayofweek
        expenses['dayofmonth'] = expenses['date'].dt.day
        expenses['month'] = expenses['date'].dt.month
        expenses['dayofyear'] = expenses['date'].dt.dayofyear

        daily_expenses = expenses.groupby(expenses['date'].dt.date).agg({
            'amount': 'sum',
            'dayofweek': 'first',
            'dayofmonth': 'first',
            'month': 'first',
            'dayofyear': 'first'
        }).reset_index()

        feature_cols = ['dayofweek', 'dayofmonth', 'month', 'dayofyear']
        X = daily_expenses[feature_cols].values
        y = daily_expenses['amount'].values

        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)

        model = RandomForestRegressor(n_estimators=100, max_depth=10, random_state=42)
        model.fit(X_scaled, y)

        last_date = daily_expenses['date'].max()
        future_dates_week = pd.date_range(start=last_date + pd.Timedelta(days=1), periods=7)
        future_dates_month = pd.date_range(start=last_date + pd.Timedelta(days=1), periods=30)

        def prepare_features(dates):
            return pd.DataFrame({
                'dayofweek': dates.dayofweek,
                'dayofmonth': dates.day,
                'month': dates.month,
                'dayofyear': dates.dayofyear
            })

        week_features = scaler.transform(prepare_features(future_dates_week))
        month_features = scaler.transform(prepare_features(future_dates_month))

        week_preds = model.predict(week_features)
        month_preds = model.predict(month_features)

        week_pred = max(0, week_preds.sum())
        month_pred = max(0, month_preds.sum())

        recent_30 = daily_expenses.tail(30)['amount'].values
        historical_std = np.std(recent_30) if len(recent_30) > 1 else 0
        historical_mean = np.mean(recent_30)

        week_confidence = max(0, min(100, 100 - (historical_std / (historical_mean + 1)) * 20))
        month_confidence = max(0, min(100, 100 - (historical_std / (historical_mean + 1)) * 30))

        incomes = df[df['type'] == 'income']
        avg_monthly_income = incomes.groupby(incomes['date'].dt.month)['amount'].sum().mean() if len(incomes) > 0 else 0
        predicted_savings = avg_monthly_income - month_pred

        recent_trend = daily_expenses.tail(14)['amount'].mean()
        older_trend = daily_expenses.tail(28).head(14)['amount'].mean() if len(daily_expenses) >= 28 else recent_trend
        trend = 'increasing' if recent_trend > older_trend * 1.1 else ('decreasing' if recent_trend < older_trend * 0.9 else 'stable')

        return jsonify({
            'predictions': {
                'nextWeek': {'amount': round(week_pred, 2), 'confidence': round(week_confidence, 1)},
                'nextMonth': {'amount': round(month_pred, 2), 'confidence': round(month_confidence, 1)},
                'nextMonthSavings': round(predicted_savings, 2),
                'trend': trend
            },
            'source': 'ai_service'
        })

    except Exception as e:
        return jsonify({'error': str(e), 'traceback': traceback.format_exc()}), 500

@app.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        message = data.get('message', '').lower().strip()
        context = data.get('context', {})
        transactions = context.get('transactions', [])

        from sklearn.feature_extraction.text import TfidfVectorizer
        from sklearn.metrics.pairwise import cosine_similarity

        intents = {
            'spending_habits': ['where does my money go', 'spending habits', 'what do i spend on', 'analyze my spending'],
            'saving_tips': ['how to save money', 'saving tips', 'save more', 'reduce expenses', 'cut costs'],
            'budget_advice': ['how to budget', 'budget tips', 'create a budget', 'budgeting'],
            'investment': ['how to invest', 'investment tips', 'invest money', 'where to invest', 'stock market'],
            'debt': ['how to pay off debt', 'debt management', 'reduce debt', 'loan'],
            'emergency_fund': ['emergency fund', 'rainy day fund', 'how much emergency fund'],
            'retirement': ['retirement planning', 'retirement savings', 'retire', '401k'],
            'financial_goals': ['financial goals', 'set goals', 'savings goals', 'target']
        }

        def get_intent(msg):
            max_sim = 0
            best_intent = 'general'
            for intent, examples in intents.items():
                vectors = TfidfVectorizer().fit_transform([msg] + examples)
                sim = cosine_similarity(vectors[0:1], vectors[1:]).max()
                if sim > max_sim:
                    max_sim = sim
                    best_intent = intent
            return best_intent if max_sim > 0.3 else 'general'

        intent = get_intent(message)

        categories = {}
        if transactions:
            for t in transactions:
                if t.get('type') == 'expense':
                    cat = t.get('category', 'Other')
                    categories[cat] = categories.get(cat, 0) + t.get('amount', 0)

        total_expenses = sum(categories.values())
        top_category = max(categories, key=categories.get) if categories else 'unknown'
        top_percent = round((categories.get(top_category, 0) / (total_expenses or 1)) * 100)

        responses = {
            'spending_habits': f"Based on your transactions, your top spending category is **{top_category}** ({top_percent}% of total expenses). "
                              f"{'Consider reducing spending here to save more.' if top_percent > 30 else 'Your spending looks well diversified.'}",
            'saving_tips': "Here are proven saving strategies:\n1. **50/30/20 Rule:** 50% needs, 30% wants, 20% savings\n"
                          "2. **Automate savings:** Set up auto-transfers on payday\n"
                          "3. **Track every expense** for 30 days to find leaks\n"
                          "4. **Cancel unused subscriptions**\n"
                          "5. **Cook at home** more often",
            'budget_advice': "To create an effective budget:\n1. **Track your income** and fixed expenses first\n"
                           "2. **Set category limits** based on past spending\n"
                           "3. **Use the envelope system** for variable expenses\n"
                           "4. **Review weekly** and adjust as needed\n"
                           "5. **Include fun money** to stay consistent",
            'investment': "For beginners:\n1. **Start with index funds** (S&P 500, Total Market)\n"
                        "2. **Use tax-advantaged accounts** (401k, IRA)\n"
                        "3. **Dollar-cost average** instead of timing the market\n"
                        "4. **Keep fees low** (< 0.1% ER)\n"
                        "5. **Reinvest dividends** for compound growth",
            'debt': "To eliminate debt:\n1. **List all debts** with interest rates\n"
                  "2. **Avalanche method:** Pay highest interest first\n"
                  "3. **Snowball method:** Pay smallest balance first\n"
                  "4. **Consider consolidation** for high-interest debt\n"
                  "5. **Pay more than minimum** whenever possible",
            'emergency_fund': "Your emergency fund should cover **3-6 months** of essential expenses. "
                            "Start with a $1,000 mini-fund, then build up. Keep it in a high-yield savings account.",
            'retirement': "For retirement planning:\n1. **Start early** to maximize compound growth\n"
                        "2. **Contribute at least enough** to get employer match\n"
                        "3. **Increase contributions** by 1% each year\n"
                        "4. **Target-date funds** are great for hands-off investors\n"
                        "5. **Aim to save 15%** of pre-tax income",
            'financial_goals': "To set effective financial goals:\n1. **Make them SMART** (Specific, Measurable, Achievable, Relevant, Time-bound)\n"
                             "2. **Break big goals** into monthly targets\n"
                             "3. **Track progress** weekly\n"
                             "4. **Celebrate milestones** to stay motivated\n"
                             "5. **Review and adjust** quarterly",
            'general': "I can help you with:\n• Understanding your spending habits\n• Saving strategies and tips\n• Budget creation and management\n• Investment basics\n• Debt management\n• Emergency fund planning\n• Financial goal setting\n\nWhat would you like to know more about?"
        }

        reply = responses.get(intent, responses['general'])
        return jsonify({'reply': reply, 'intent': intent, 'source': 'ai_service'})

    except Exception as e:
        return jsonify({'reply': 'I can help with budgeting, saving, investing, and debt management. What do you need?', 'source': 'fallback'})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=True)
