def hello_world():
    print("Hello, World!")
    return "This is a simple Python test file"

def calculate_sum(a, b):
    """Calculate the sum of two numbers"""
    return a + b

if __name__ == "__main__":
    hello_world()
    result = calculate_sum(5, 3)
    print(f"Sum: {result}")
