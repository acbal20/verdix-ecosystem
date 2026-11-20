from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

setup(
    name="verdix-ai",
    version="1.0.0",
    author="Verdix",
    author_email="acbal20@gmail.com",
    description="Verdix AI CLI - Asistente de IA para la terminal",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://verdix-ecosystem.vercel.app",
    packages=find_packages(),
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
        "Environment :: Console",
        "Intended Audience :: End Users/Desktop",
    ],
    python_requires=">=3.7",
    install_requires=[],
    entry_points={
        "console_scripts": [
            "verdix-ai=verdix_ai.cli:main",
        ],
    },
)
